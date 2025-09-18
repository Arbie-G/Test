import React, { useState, useRef, useEffect } from "react";
import styles from "./HeaderMenu.module.css";

const HeaderMenu: React.FC<{
  onProfileClick?: () => void;
  onAdminClick?: () => void;
  onTeamsClick?: () => void;
  onAboutClick?: () => void;
  onHomeClick?: () => void;
  onServicesClick?: () => void;
  onContactClick?: () => void;
  onLogout?: () => void;
  currentUser?: { id: string; email: string; name: string; role?: string } | null;
  isAdmin?: boolean;
}> = ({
  onProfileClick,
  onAdminClick,
  onTeamsClick,
  onAboutClick,
  onHomeClick,
  onServicesClick,
  onContactClick,
  onLogout,
  currentUser,
  isAdmin,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [me, setMe] = useState<{
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: string;
  } | null>(currentUser || null);
  // const [tempData, setTempData] = useState(null); // might need this later
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Close dropdown when clicking outside (TODO: maybe add animation?)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update local state when currentUser prop changes
  useEffect(() => {
    if (currentUser) {
      setMe(currentUser);
      setNameInput(currentUser.name || "");
    }
  }, [currentUser]);

  // Load profile on mount and listen for updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem("authToken");
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    const res = await fetch(input, { ...init, headers });
    return res;
  }

  async function fetchProfile() {
    try {
      console.log('HeaderMenu: Fetching profile data');
      const res = await authFetch("/api/users/me");
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : null;
      console.log('HeaderMenu: Profile data received:', data);
      
      setMe(data);
      setNameInput(data?.name || "");
      
      // Trigger a re-render by updating the parent component's user data
      if (data && currentUser) {
        console.log('HeaderMenu: Dispatching userDataUpdated event with:', {
          ...currentUser, 
          name: data.name, 
          avatarUrl: data.avatarUrl 
        });
        // Update the parent's currentUser state through a custom event
        window.dispatchEvent(new CustomEvent("userDataUpdated", { 
          detail: { ...currentUser, name: data.name, avatarUrl: data.avatarUrl } 
        }));
      }
    } catch (err) {
      console.log("fetch failed:", err);
    }
  }


  async function saveProfile() {
    try {
      const res = await authFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name: nameInput }),
      });
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : null;
      setMe(data);
      setEditing(false);
    } catch {}
  }

  function logout() {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("authToken");
      window.location.reload();
    }
  }

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📋</span>
          <span className={styles.logoText}>AyaSync</span>
        </div>
      </div>
      
      <div className={styles.centerSection}>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.userInfo}>
          <span className={styles.username}>{currentUser?.name || me?.name || currentUser?.email?.split('@')[0] || me?.email?.split('@')[0] || 'User'}</span>
        </div>
        <button 
          className={styles.signOutButton}
          onClick={logout}
        >
          Sign Out
        </button>
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button 
            className={`${styles.profileButton} ${open ? styles.active : ''}`}
            onClick={() => setOpen(!open)}
          >
            <div className={styles.profileAvatar}>
              {me?.avatarUrl ? (
                <img 
                  src={me.avatarUrl} 
                  alt="Profile" 
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarIcon}>👤</span>
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{currentUser?.name || me?.name || currentUser?.email?.split('@')[0] || me?.email?.split('@')[0] || 'User'}</span>
              <span className={styles.profileEmail}>{currentUser?.email || me?.email}</span>
            </div>
            <div className={styles.dropdownArrow}>
              <span className={`${styles.arrow} ${open ? styles.arrowUp : ''}`}>▼</span>
            </div>
          </button>

          {/* Settings Dropdown */}
          {open && (
            <div className={styles.dropdown}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onProfileClick?.();
                  setOpen(false);
                }}
              >
                <span>⚙️</span> Profile Settings
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTeamsClick?.();
                  setOpen(false);
                }}
              >
                <span>👥</span> Team Management
              </a>
              {(isAdmin || currentUser?.role === 'admin') && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onAdminClick?.();
                    setOpen(false);
                  }}
                >
                  <span>🔐</span> Admin Dashboard
                </a>
              )}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onAboutClick?.();
                  setOpen(false);
                }}
              >
                <span>ℹ️</span> About
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onServicesClick?.();
                  setOpen(false);
                }}
              >
                <span>🛠️</span> Services
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onContactClick?.();
                  setOpen(false);
                }}
              >
                <span>📧</span> Contact
              </a>
            </div>
          )}
        </div>
        <a href="#" className={styles.link}></a>
      </div>
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              width: 360,
              border: "2px solid #0e3ca8",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
            <label>Name</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
              }}
            />
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button className={styles.link} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className={styles.link} onClick={saveProfile}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
