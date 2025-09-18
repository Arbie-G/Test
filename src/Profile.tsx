import React, { useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { globalActivityTracker } from "./globalActivityTracker";

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: string;
}

interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

const Profile: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<
    "square" | "circle" | "rectangle"
  >("square");
  const [activeFilter, setActiveFilter] = useState<string>("none");

  // Load user profile and connections
  useEffect(() => {
    loadProfile();
    loadConnections();
    loadAllUsers();
  }, []);

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem("authToken");
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    const res = await fetch(input, { ...init, headers });
    return res;
  }

  async function loadProfile() {
    try {
      const res = await authFetch("/api/users/me");
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (e) {
      setError('Network error loading profile');
    }
  }

  async function loadConnections() {
    try {
      const res = await authFetch("/api/users/connections");
      const data = await res.json();
      if (res.ok) {
        setConnections(data);
      }
    } catch (e) {
      console.log("Failed to load connections:", e);
    }
  }

  async function loadAllUsers() {
    try {
      const res = await authFetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setAllUsers(data);
      }
    } catch (e) {
      console.log("Failed to load users:", e);
    }
  }

  async function updateProfile(updates: Partial<User>) {
    try {
      setLoading(true);
      console.log('Updating profile with:', updates);
      
      const res = await authFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      console.log('Profile update response:', { ok: res.ok, data });
      
      if (res.ok) {
        setUser(data);
        
        // Track activity
        const updatedFields = Object.keys(updates).join(', ');
        globalActivityTracker.trackActivity({
          action: `Updated profile: ${updatedFields}`,
          user: user?.email || 'Unknown',
          details: `Profile fields updated: ${updatedFields}`,
          type: 'profile'
        });
        
        // Trigger profile update event for other components
        console.log('Dispatching profileUpdated event');
        window.dispatchEvent(new CustomEvent("profileUpdated"));
      } else {
        console.error('Profile update failed:', data);
        setError(data?.error || "Failed to update profile");
      }
    } catch (e) {
      console.error('Profile update error:', e);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function sendConnectionRequest(userId: string) {
    try {
      const res = await authFetch("/api/users/connections", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        loadConnections();
        setShowAddConnection(false);
        setSearchEmail("");
        
        // Track activity
        const targetUser = allUsers.find(u => u.id === userId);
        globalActivityTracker.trackActivity({
          action: `Sent connection request to ${targetUser?.email || 'Unknown User'}`,
          user: user?.email || 'Unknown',
          target: targetUser?.email,
          details: `Connection request sent`,
          type: 'connection'
        });
      }
    } catch (e) {
      setError("Failed to send connection request");
    }
  }

  async function respondToConnection(
    connectionId: string,
    status: "accepted" | "declined",
  ) {
    try {
      const res = await authFetch(`/api/users/connections/${connectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadConnections();
        
        // Track activity
        const connection = connections.find(c => c.id === connectionId);
        const targetUser = allUsers.find(u => u.id === connection?.connectedUserId);
        globalActivityTracker.trackActivity({
          action: `${status === 'accepted' ? 'Accepted' : 'Declined'} connection request from ${targetUser?.email || 'Unknown User'}`,
          user: user?.email || 'Unknown',
          target: targetUser?.email,
          details: `Connection ${status}`,
          type: 'connection'
        });
      }
    } catch (e) {
      setError("Failed to respond to connection");
    }
  }

  async function removeConnection(connectionId: string) {
    try {
      const res = await authFetch(`/api/users/connections/${connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadConnections();
        
        // Track activity
        const connection = connections.find(c => c.id === connectionId);
        const targetUser = allUsers.find(u => u.id === connection?.connectedUserId);
        globalActivityTracker.trackActivity({
          action: `Removed connection with ${targetUser?.email || 'Unknown User'}`,
          user: user?.email || 'Unknown',
          target: targetUser?.email,
          details: `Connection removed`,
          type: 'connection'
        });
      }
    } catch (e) {
      setError("Failed to remove connection");
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    
    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      setError(
        `File size must be less than 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
      return;
    }

    
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "image/ico",
    ];

    if (!validImageTypes.includes(file.type.toLowerCase())) {
      setError(
        "Please select a valid image file (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO)",
      );
      return;
    }

    // Clear any previous errors
    setError(null);
    setSelectedFile(file);

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCropImage(imageUrl);
      setShowCropModal(true);
    };
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };


  const handleCropConfirm = () => {
    if (!cropImage) return;

    setIsUploading(true);
    setUploadProgress(0);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Set canvas size based on aspect ratio
      canvas.width = aspectRatio === "rectangle" ? 400 : 200;
      canvas.height = aspectRatio === "rectangle" ? 300 : 200;

      if (ctx) {
        // Calculate the scale factor between displayed image and actual image
        const scaleX = img.naturalWidth / imageDimensions.width;
        const scaleY = img.naturalHeight / imageDimensions.height;

        // Convert crop coordinates from display coordinates to actual image coordinates
        const sourceX = cropData.x * scaleX;
        const sourceY = cropData.y * scaleY;
        const sourceWidth = cropData.width * scaleX;
        const sourceHeight = cropData.height * scaleY;

        // Apply brightness and contrast filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        // Draw the cropped portion of the image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        // Apply rotation if needed
        if (rotation !== 0) {
          const rotatedCanvas = document.createElement("canvas");
          const rotatedCtx = rotatedCanvas.getContext("2d");

          if (rotatedCtx) {
            rotatedCanvas.width = canvas.width;
            rotatedCanvas.height = canvas.height;

            rotatedCtx.translate(canvas.width / 2, canvas.height / 2);
            rotatedCtx.rotate((rotation * Math.PI) / 180);
            rotatedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

            // Copy rotated image back to original canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(rotatedCanvas, 0, 0);
          }
        }

        // Apply additional filters
        if (activeFilter !== "none") {
          applyFilter(ctx, canvas, activeFilter);
        }

        // Convert to base64
        const croppedImageUrl = canvas.toDataURL("image/png", 0.9);

        // Update profile with cropped image
        updateProfile({ avatarUrl: croppedImageUrl }).finally(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
          setShowCropModal(false);
          setCropImage(null);
          // Reset customization values
          setRotation(0);
          setBrightness(100);
          setContrast(100);
          setZoom(100);
          setAspectRatio("square");
          setActiveFilter("none");
        });

        // Trigger profile update event
        window.dispatchEvent(new CustomEvent("profileUpdated"));
      }
    };

    img.src = cropImage;
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImage(null);
    setSelectedFile(null);
    // Reset customization values
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setZoom(100);
    handleAspectRatioChange("square");
    setActiveFilter("none");
  };

  // Apply image filters
  const applyFilter = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    filter: string,
  ) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (filter) {
      case "grayscale":
        for (let i = 0; i < data.length; i += 4) {
          const gray =
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
      case "sepia":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;
      case "vintage":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.max(0, data[i + 2] * 0.9);
        }
        break;
      case "cool":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.9);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
        }
        break;
      case "warm":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.max(0, data[i + 2] * 0.9);
        }
        break;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerWidth = 400; // Max width of crop container
    const containerHeight = 400; // Max height of crop container

    // Calculate display dimensions
    const aspectRatioValue = img.naturalWidth / img.naturalHeight;
    let displayWidth = containerWidth;
    let displayHeight = containerHeight;

    if (aspectRatioValue > 1) {
      // Landscape
      displayHeight = containerWidth / aspectRatioValue;
    } else {
      // Portrait or square
      displayWidth = containerHeight * aspectRatioValue;
    }

    setImageDimensions({ width: displayWidth, height: displayHeight });

    // Initialize crop area based on selected aspect ratio
    let cropSize = Math.min(displayWidth, displayHeight) * 0.6; // 60% of smaller dimension
    let cropWidth = cropSize;
    let cropHeight = cropSize;

    if (aspectRatio === "rectangle") {
      cropSize = Math.min(displayWidth, displayHeight) * 0.8;
      cropWidth = cropSize * 1.5;
      cropHeight = cropSize;
    }

    // Ensure crop area doesn't exceed image bounds
    cropWidth = Math.min(cropWidth, displayWidth);
    cropHeight = Math.min(cropHeight, displayHeight);

    setCropData({
      x: Math.max(0, (displayWidth - cropWidth) / 2),
      y: Math.max(0, (displayHeight - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    });
  };

  const handleAspectRatioChange = (
    newAspectRatio: "square" | "circle" | "rectangle",
  ) => {
    setAspectRatio(newAspectRatio);

    // Recalculate crop area when aspect ratio changes
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      let cropSize =
        Math.min(imageDimensions.width, imageDimensions.height) * 0.6;
      let cropWidth = cropSize;
      let cropHeight = cropSize;

      if (newAspectRatio === "rectangle") {
        cropSize =
          Math.min(imageDimensions.width, imageDimensions.height) * 0.8;
        cropWidth = cropSize * 1.5;
        cropHeight = cropSize;
      }

      // Ensure crop area doesn't exceed image bounds
      cropWidth = Math.min(cropWidth, imageDimensions.width);
      cropHeight = Math.min(cropHeight, imageDimensions.height);

      setCropData((prev) => ({
        x: Math.max(0, Math.min(prev.x, imageDimensions.width - cropWidth)),
        y: Math.max(0, Math.min(prev.y, imageDimensions.height - cropHeight)),
        width: cropWidth,
        height: cropHeight,
      }));
    }
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showCropModal) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update crop position (keep within bounds)
    setCropData((prev) => ({
      ...prev,
      x: Math.max(
        0,
        Math.min(x - prev.width / 2, imageDimensions.width - prev.width),
      ),
      y: Math.max(
        0,
        Math.min(y - prev.height / 2, imageDimensions.height - prev.height),
      ),
    }));
  };

  const handleCropDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const container = e.currentTarget.parentElement;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCropX = cropData.x;
    const startCropY = cropData.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setCropData((prev) => ({
        ...prev,
        x: Math.max(
          0,
          Math.min(startCropX + deltaX, imageDimensions.width - prev.width),
        ),
        y: Math.max(
          0,
          Math.min(startCropY + deltaY, imageDimensions.height - prev.height),
        ),
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleCropResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: "nw" | "se",
  ) => {
    e.stopPropagation();
    const container = e.currentTarget.closest(
      ".cropImageContainer",
    ) as HTMLElement;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCropData = { ...cropData };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setCropData((prev) => {
        const newData = { ...prev };

        if (direction === "nw") {
          // Resize from top-left corner
          newData.width = Math.max(50, startCropData.width - deltaX);
          newData.height = Math.max(50, startCropData.height - deltaY);
          newData.x = Math.max(
            0,
            Math.min(
              startCropData.x + deltaX,
              startCropData.x + startCropData.width - 50,
            ),
          );
          newData.y = Math.max(
            0,
            Math.min(
              startCropData.y + deltaY,
              startCropData.y + startCropData.height - 50,
            ),
          );
        } else {
          // Resize from bottom-right corner
          newData.width = Math.max(
            50,
            Math.min(
              startCropData.width + deltaX,
              imageDimensions.width - startCropData.x,
            ),
          );
          newData.height = Math.max(
            50,
            Math.min(
              startCropData.height + deltaY,
              imageDimensions.height - startCropData.y,
            ),
          );
        }

        return newData;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== user?.id &&
      !connections.some(
        (c) => c.connectedUserId === u.id || c.userId === u.id,
      ) &&
      (searchEmail === "" ||
        u.email.toLowerCase().includes(searchEmail.toLowerCase())),
  );

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1>Profile Settings</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {/* Profile Section */}
        <div className={styles.section}>
          <h2>Profile Information</h2>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarWrapper}>
                  <img
                    src={user?.avatarUrl || "/default-avatar.svg"}
                    alt="Profile"
                    className={styles.avatar}
                    style={{
                      opacity: isUploading ? 0.7 : 1,
                      transition: "opacity 0.3s ease",
                    }}
                  />
                  {isUploading && (
                    <div className={styles.uploadOverlay}>
                      <div className={styles.uploadProgress}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className={styles.uploadText}>
                        {uploadProgress < 100
                          ? "Uploading..."
                          : "Processing..."}
                      </div>
                    </div>
                  )}
                </div>
                <label
                  className={styles.avatarUpload}
                  style={{
                    opacity: isUploading ? 0.5 : 1,
                    cursor: isUploading ? "not-allowed" : "pointer",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploading}
                    style={{ display: "none" }}
                  />
                  {isUploading ? "Uploading..." : "Change Avatar"}
                </label>
                <div className={styles.uploadInfo}>
                  <small>
                    Supports: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO
                  </small>
                  <small>Max size: 5MB</small>
                  {selectedFile && (
                    <div className={styles.fileInfo}>
                      <small style={{ color: "#0e3ca8", fontWeight: "600" }}>
                        Selected: {selectedFile.name}
                      </small>
                      <small style={{ color: "#6b7280" }}>
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.field}>
                <label>Name</label>
                <input
                  type="text"
                  value={user?.name || user?.email?.split('@')[0] || ""}
                  onChange={(e) =>
                    setUser((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  onBlur={(e) => {
                    const newName = e.target.value.trim();
                    if (newName !== (user?.name || '')) {
                      updateProfile({ name: newName });
                    }
                  }}
                  placeholder={user?.email?.split('@')[0] || "Enter your name"}
                />
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className={styles.disabled}
                />
              </div>

              <div className={styles.field}>
                <label>Role</label>
                <div className={`${styles.roleDisplay} ${styles[user?.role || 'user']}`}>
                  <span className={styles.roleIcon}>
                    {user?.role === 'admin' ? '👑' : '👤'}
                  </span>
                  <span className={styles.roleText}>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label>Account Status</label>
                <div className={`${styles.statusDisplay} ${user?.isActive ? styles.active : styles.inactive}`}>
                  <span className={styles.statusIcon}>
                    {user?.isActive ? '✅' : '❌'}
                  </span>
                  <span className={styles.statusText}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {user?.lastLogin && (
                <div className={styles.field}>
                  <label>Last Login</label>
                  <div className={styles.lastLoginDisplay}>
                    <span className={styles.lastLoginIcon}>🕒</span>
                    <span className={styles.lastLoginText}>
                      {new Date(user.lastLogin).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Connections Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Connections</h2>
            <button
              onClick={() => setShowAddConnection(!showAddConnection)}
              className={styles.addButton}
            >
              + Add Connection
            </button>
          </div>

          {showAddConnection && (
            <div className={styles.addConnection}>
              <h3>Find Users</h3>
              <input
                type="email"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className={styles.searchInput}
              />

              <div className={styles.userList}>
                {filteredUsers.map((u) => (
                  <div key={u.id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <img
                        src={u.avatarUrl || "/default-avatar.svg"}
                        alt="User"
                        className={styles.userAvatar}
                      />
                      <div>
                        <div className={styles.userName}>
                          {u.name || "Unnamed"}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => sendConnectionRequest(u.id)}
                      className={styles.connectButton}
                    >
                      Connect
                    </button>
                  </div>
                ))}
                {filteredUsers.length === 0 && searchEmail && (
                  <div className={styles.noResults}>No users found</div>
                )}
              </div>
            </div>
          )}

          <div className={styles.connectionsList}>
            {connections.map((conn) => {
              const connectedUser = allUsers.find(
                (u) => u.id === conn.connectedUserId,
              );
              if (!connectedUser) return null;

              return (
                <div key={conn.id} className={styles.connectionItem}>
                  <div className={styles.connectionInfo}>
                    <img
                      src={connectedUser.avatarUrl || "/default-avatar.svg"}
                      alt="User"
                      className={styles.connectionAvatar}
                    />
                    <div>
                      <div className={styles.connectionName}>
                        {connectedUser.name || "Unnamed"}
                      </div>
                      <div className={styles.connectionEmail}>
                        {connectedUser.email}
                      </div>
                      <div className={styles.connectionStatus}>
                        Status:{" "}
                        <span className={styles[conn.status]}>
                          {conn.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.connectionActions}>
                    {conn.status === "pending" && (
                      <>
                        {user?.id === conn.connectedUserId ? (
                          // You received the request → Approve or Cancel
                          <>
                            <button
                              onClick={() => respondToConnection(conn.id, "accepted")}
                              className={styles.acceptButton}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => respondToConnection(conn.id, "declined")}
                              className={styles.CancelButton}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          // You sent the request → only Cancel
                          <button
                            onClick={() => respondToConnection(conn.id, "declined")}
                            className={styles.CancelButton}
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                    {conn.status === "accepted" && (
                      <button
                        onClick={() => removeConnection(conn.id)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {connections.length === 0 && (
              <div className={styles.noConnections}>
                No connections yet. Add some connections to collaborate!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Crop Modal */}
      {showCropModal && cropImage && (
        <div className={styles.cropModal}>
          <div className={styles.cropModalContent}>
            <h3>Customize Your Avatar</h3>

            {/* Aspect Ratio Selection */}
            <div className={styles.aspectRatioSection}>
              <h4>Shape</h4>
              <div className={styles.aspectRatioButtons}>
                <button
                  className={`${styles.aspectRatioBtn} ${aspectRatio === "square" ? styles.active : ""}`}
                  onClick={() => handleAspectRatioChange("square")}
                >
                  Square
                </button>
                <button
                  className={`${styles.aspectRatioBtn} ${aspectRatio === "circle" ? styles.active : ""}`}
                  onClick={() => handleAspectRatioChange("circle")}
                >
                  Circle
                </button>
                <button
                  className={`${styles.aspectRatioBtn} ${aspectRatio === "rectangle" ? styles.active : ""}`}
                  onClick={() => handleAspectRatioChange("rectangle")}
                >
                  Rectangle
                </button>
              </div>
            </div>

            {/* Crop Container */}
            <div className={styles.cropContainer}>
              <div
                className={styles.cropImageContainer}
                onClick={handleCropMove}
              >
                <img
                  src={cropImage}
                  alt="Crop"
                  className={styles.cropImage}
                  onLoad={handleImageLoad}
                  style={{
                    width: imageDimensions.width || "auto",
                    height: imageDimensions.height || "auto",
                    transform: `rotate(${rotation}deg)`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  }}
                />
                <div
                  className={`${styles.cropOverlay} ${aspectRatio === "circle" ? styles.circle : ""}`}
                  style={{
                    left: cropData.x,
                    top: cropData.y,
                    width: cropData.width,
                    height: cropData.height,
                  }}
                  onMouseDown={handleCropDrag}
                >
                  <div
                    className={styles.cropHandle + " " + styles.nw}
                    onMouseDown={(e) => handleCropResize(e, "nw")}
                  />
                  <div
                    className={styles.cropHandle + " " + styles.se}
                    onMouseDown={(e) => handleCropResize(e, "se")}
                  />
                </div>
              </div>
            </div>

            {/* Customization Controls */}
            <div className={styles.customizationControls}>
              {/* Rotation */}
              <div className={styles.controlGroup}>
                <label>Rotation: {rotation}°</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className={styles.slider}
                  />
                  <button
                    className={styles.resetBtn}
                    onClick={() => setRotation(0)}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Brightness */}
              <div className={styles.controlGroup}>
                <label>Brightness: {brightness}%</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className={styles.slider}
                  />
                  <button
                    className={styles.resetBtn}
                    onClick={() => setBrightness(100)}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Contrast */}
              <div className={styles.controlGroup}>
                <label>Contrast: {contrast}%</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className={styles.slider}
                  />
                  <button
                    className={styles.resetBtn}
                    onClick={() => setContrast(100)}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Zoom */}
              <div className={styles.controlGroup}>
                <label>Zoom: {zoom}%</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value))}
                    className={styles.slider}
                  />
                  <button
                    className={styles.resetBtn}
                    onClick={() => setZoom(100)}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className={styles.previewSection}>
              <h4>Preview</h4>
              <div className={styles.previewContainer}>
                <div className={styles.previewAvatar}>
                  <img
                    src={cropImage}
                    alt="Preview"
                    className={`${styles.previewImage} ${aspectRatio === "circle" ? styles.circle : ""}`}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    }}
                  />
                </div>
                <div className={styles.previewInfo}>
                  <p>Shape: {aspectRatio}</p>
                  <p>Rotation: {rotation}°</p>
                  <p>Brightness: {brightness}%</p>
                  <p>Contrast: {contrast}%</p>
                  <p>Filter: {activeFilter}</p>
                </div>
              </div>
            </div>

            {/* Filter Presets */}
            <div className={styles.filterSection}>
              <h4>Filters</h4>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterBtn} ${activeFilter === "none" ? styles.active : ""}`}
                  onClick={() => setActiveFilter("none")}
                >
                  None
                </button>
                <button
                  className={`${styles.filterBtn} ${activeFilter === "grayscale" ? styles.active : ""}`}
                  onClick={() => setActiveFilter("grayscale")}
                >
                  Grayscale
                </button>
                <button
                  className={`${styles.filterBtn} ${activeFilter === "sepia" ? styles.active : ""}`}
                  onClick={() => setActiveFilter("sepia")}
                >
                  Sepia
                </button>
                <button
                  className={`${styles.filterBtn} ${activeFilter === "vintage" ? styles.active : ""}`}
                  onClick={() => setActiveFilter("vintage")}
                >
                  Vintage
                </button>
                <button
                  className={`${styles.filterBtn} ${activeFilter === "cool" ? styles.active : ""}`}
                  onClick={() => setActiveFilter("cool")}
                >
                  Cool
                </button>
                <button
                  className={`${styles.filterBtn} ${activeFilter === "warm" ? styles.active : ""}`}
                  onClick={() => setActiveFilter("warm")}
                >
                  Warm
                </button>
              </div>
            </div>

            <div className={styles.cropInstructions}>
              <p>• Click and drag to move the crop area</p>
              <p>• Drag the corners to resize</p>
              <p>
                • Use sliders to adjust brightness, contrast, rotation, and zoom
              </p>
              <p>• Try different filters for unique looks</p>
            </div>

            {/* Reset All Button */}
            <div className={styles.resetAllSection}>
              <button
                className={styles.resetAllBtn}
                onClick={() => {
                  setRotation(0);
                  setBrightness(100);
                  setContrast(100);
                  setZoom(100);
                  handleAspectRatioChange("square");
                  setActiveFilter("none");
                }}
              >
                Reset All Settings
              </button>
            </div>

            <div className={styles.cropButtons}>
              <button
                className={styles.cancelButton}
                onClick={handleCropCancel}
              >
                Cancel
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleCropConfirm}
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Apply & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
