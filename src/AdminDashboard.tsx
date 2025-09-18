import React, { useState, useEffect } from "react";
import styles from "./AdminDashboard.module.css";
import { globalActivityTracker } from "./globalActivityTracker";
import { getAllTeams } from './services/teamService';
import type { Activity } from "./globalActivityTracker";
import type { Team } from "./types/team";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  lastUpdated: string;
}

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
}

interface SystemHealth {
  uptime: string;
  memoryUsage: number;
  activeConnections: number;
  responseTime: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'permission_change' | 'data_access';
  user: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [notifications] = useState<string[]>([
    "⚠ Security Alert: Multiple failed login attempts detected.",
    "✅ Backup completed successfully at 3:00 AM.",
    "📊 Weekly analytics report is ready for review.",
    "🔄 System maintenance scheduled for tonight at 2:00 AM.",
  ]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'teams' | 'tasks' | 'security' | 'system'>('overview');
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem("authToken");
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    const res = await fetch(input, { ...init, headers });
    return res;
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError("Failed to load users");
      }
    } catch (e) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await authFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const loadTeams = async () => {
    try {
      const allTeams = await getAllTeams();
      setTeams(allTeams);
    } catch (e) {
      console.error("Failed to load teams:", e);
    }
  };

  const loadTaskStats = async () => {
    try {
      // Mock task statistics - in real app, this would come from API
      const mockTaskStats: TaskStats = {
        totalTasks: 156,
        completedTasks: 89,
        pendingTasks: 67,
        highPriorityTasks: 23,
        overdueTasks: 12
      };
      setTaskStats(mockTaskStats);
    } catch (e) {
      console.error("Failed to load task stats:", e);
    }
  };

  const loadSystemHealth = async () => {
    try {
      // Mock system health data - in real app, this would come from system monitoring API
      const mockHealth: SystemHealth = {
        uptime: "15 days, 8 hours",
        memoryUsage: 67,
        activeConnections: 42,
        responseTime: 145,
        status: 'healthy'
      };
      setSystemHealth(mockHealth);
    } catch (e) {
      console.error("Failed to load system health:", e);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      // Mock security events - in real app, this would come from security monitoring API
      const mockEvents: SecurityEvent[] = [
        {
          id: "1",
          type: "failed_login",
          user: "unknown@example.com",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          details: "Multiple failed login attempts from IP 192.168.1.100",
          severity: "high"
        },
        {
          id: "2",
          type: "permission_change",
          user: "admin@test.com",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          details: "User role changed from user to admin",
          severity: "medium"
        },
        {
          id: "3",
          type: "data_access",
          user: "user@test.com",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          details: "Accessed sensitive user data export",
          severity: "low"
        }
      ];
      setSecurityEvents(mockEvents);
    } catch (e) {
      console.error("Failed to load security events:", e);
    }
  };

  useEffect(() => {
    // Load current user profile
    const loadCurrentUser = async () => {
      try {
        const res = await authFetch("/api/users/me");
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);

          // Activity service connection
          console.log('Admin user loaded:', userData.email);
        }
      } catch (e) {
        console.error("Failed to load current user:", e);
      }
    };

    // Debug: Check if user has admin access
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Admin Dashboard - User role:", payload.role);
        if (payload.role !== 'admin') {
          console.warn("Non-admin user attempting to access admin dashboard");
        }
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }

    loadCurrentUser();
    loadUsers();
    loadStats();
    loadTeams();
    loadTaskStats();
    loadSystemHealth();
    loadSecurityEvents();

    // Set up auto-refresh for real-time data
    const interval = setInterval(() => {
      loadStats();
      loadSystemHealth();
      loadSecurityEvents();
    }, 30000); // Refresh every 30 seconds

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Set up activity listeners
    globalActivityTracker.onNewActivity((activity: Activity) => {
      setActivityLog(prev => [activity, ...prev.slice(0, 99)]); // Keep last 100 activities
    });

    // Load recent activities
    const recentActivities = globalActivityTracker.getRecentActivities();
    setActivityLog(recentActivities);

    // Cleanup on unmount
    return () => {
      globalActivityTracker.removeAllListeners();
    };
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setEditingUser({
      id: "",
      email: "",
      name: "",
      role: "user",
      isActive: true,
    });
    setShowUserModal(true);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      for (const userId of selectedUsers) {
        if (bulkAction === "delete") {
          await authFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        } else if (bulkAction === "deactivate") {
          await authFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
          });
        } else if (bulkAction === "activate") {
          await authFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
          });
        }
      }

      await loadUsers();
      await loadStats();
      setSelectedUsers([]);
      setBulkAction("");
      addActivityLog(`Bulk ${bulkAction} performed on ${selectedUsers.length} users`, "admin");
    } catch (e) {
      setError(`Failed to perform bulk ${bulkAction}`);
    }
  };

  const addActivityLog = (action: string, user: string, target: string = "") => {
    const newLog: Activity = {
      id: Date.now(),
      action,
      user,
      target,
      timestamp: new Date().toISOString(),
      type: 'admin'
    };
    setActivityLog(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  const exportUsers = () => {
    const csvContent = [
      ["Email", "Name", "Role", "Status", "Last Login", "Created"],
      ...users.map(user => [
        user.email,
        user.name || "",
        user.role,
        user.isActive ? "Active" : "Inactive",
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "",
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const isNewUser = !editingUser.id;
      const res = await authFetch(`/api/admin/users/${editingUser.id || 'new'}`, {
        method: isNewUser ? "POST" : "PATCH",
        body: JSON.stringify({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          isActive: editingUser.isActive,
        }),
      });

      if (res.ok) {
        await loadUsers();
        await loadStats();
        setEditingUser(null);
        setShowUserModal(false);

        // Track activity
        globalActivityTracker.trackActivity({
          action: isNewUser ? `Created new user: ${editingUser.email}` : `Updated user: ${editingUser.email}`,
          user: currentUser?.email || "admin",
          target: editingUser.email,
          details: `Role: ${editingUser.role}, Status: ${editingUser.isActive ? 'Active' : 'Inactive'}`,
          type: 'admin'
        });

        const action = isNewUser ? "User created" : "User updated";
        addActivityLog(action, "admin", editingUser.email);
      } else {
        setError("Failed to save user");
      }
    } catch (e) {
      setError("Failed to save user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!confirm(`Are you sure you want to delete user: ${user?.email}?`)) return;

    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadUsers();
        await loadStats();

        // Track activity
        globalActivityTracker.trackActivity({
          action: `Deleted user: ${user?.email || 'Unknown'}`,
          user: currentUser?.email || "admin",
          target: user?.email,
          details: `User permanently removed from system`,
          type: 'admin'
        });

        addActivityLog("User deleted", "admin", user?.email || "");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete user");
      }
    } catch (e) {
      setError("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.header}>
          <button onClick={onBack} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>Admin Dashboard</h1>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Enhanced Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={onBack} className={styles.backButton}>
            ← Back
          </button>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>🛡️ Admin Dashboard</h1>
            <p className={styles.subtitle}>Comprehensive system management and analytics</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.systemStatus}>
            <span className={`${styles.statusIndicator} ${systemHealth?.status === 'healthy' ? styles.healthy : styles.warning}`}></span>
            <span className={styles.statusText}>System {systemHealth?.status || 'Unknown'}</span>
          </div>
          <div className={styles.lastUpdated}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'users', label: '👥 Users', icon: '👥' },
          { id: 'teams', label: '🏢 Teams', icon: '🏢' },
          { id: 'tasks', label: '📋 Tasks', icon: '📋' },
          { id: 'security', label: '🔒 Security', icon: '🔒' },
          { id: 'system', label: '⚙️ System', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            {/* Enhanced Statistics Grid */}
            {stats && (
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.blue}`}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                    <h3>Total Users</h3>
                    <div className={styles.statNumber}>{stats.totalUsers}</div>
                    <div className={styles.statTrend}>+12% this month</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.green}`}>
                  <div className={styles.statIcon}>✅</div>
                  <div className={styles.statContent}>
                    <h3>Active Users</h3>
                    <div className={styles.statNumber}>{stats.activeUsers}</div>
                    <div className={styles.statTrend}>+8% this week</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.orange}`}>
                  <div className={styles.statIcon}>👑</div>
                  <div className={styles.statContent}>
                    <h3>Admins</h3>
                    <div className={styles.statNumber}>{stats.adminUsers}</div>
                    <div className={styles.statTrend}>Stable</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.purple}`}>
                  <div className={styles.statIcon}>🏢</div>
                  <div className={styles.statContent}>
                    <h3>Teams</h3>
                    <div className={styles.statNumber}>{teams.length}</div>
                    <div className={styles.statTrend}>+3 new teams</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.red}`}>
                  <div className={styles.statIcon}>📋</div>
                  <div className={styles.statContent}>
                    <h3>Total Tasks</h3>
                    <div className={styles.statNumber}>{taskStats?.totalTasks || 0}</div>
                    <div className={styles.statTrend}>{taskStats?.completedTasks || 0} completed</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.cyan}`}>
                  <div className={styles.statIcon}>📊</div>
                  <div className={styles.statContent}>
                    <h3>Activities</h3>
                    <div className={styles.statNumber}>{activityLog.length}</div>
                    <div className={styles.statTrend}>Last 24 hours</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <h2>🚀 Quick Actions</h2>
              <div className={styles.actionGrid}>
                <button className={styles.actionCard} onClick={handleAddUser}>
                  <div className={styles.actionIcon}>👤</div>
                  <div className={styles.actionContent}>
                    <h3>Add User</h3>
                    <p>Create a new user account</p>
                  </div>
                </button>
                <button className={styles.actionCard} onClick={() => setActiveTab('teams')}>
                  <div className={styles.actionIcon}>🏢</div>
                  <div className={styles.actionContent}>
                    <h3>Manage Teams</h3>
                    <p>View and organize teams</p>
                  </div>
                </button>
                <button className={styles.actionCard} onClick={exportUsers}>
                  <div className={styles.actionIcon}>📊</div>
                  <div className={styles.actionContent}>
                    <h3>Export Data</h3>
                    <p>Download user reports</p>
                  </div>
                </button>
                <button className={styles.actionCard} onClick={() => setActiveTab('security')}>
                  <div className={styles.actionIcon}>🔒</div>
                  <div className={styles.actionContent}>
                    <h3>Security Logs</h3>
                    <p>View security events</p>
                  </div>
                </button>
              </div>
            </div>

            {/* System Health Overview */}
            {systemHealth && (
              <div className={styles.systemHealthOverview}>
                <h2>⚡ System Health</h2>
                <div className={styles.healthGrid}>
                  <div className={styles.healthCard}>
                    <div className={styles.healthIcon}>⏱️</div>
                    <div className={styles.healthContent}>
                      <h4>Uptime</h4>
                      <div className={styles.healthValue}>{systemHealth.uptime}</div>
                    </div>
                  </div>
                  <div className={styles.healthCard}>
                    <div className={styles.healthIcon}>💾</div>
                    <div className={styles.healthContent}>
                      <h4>Memory Usage</h4>
                      <div className={styles.healthValue}>{systemHealth.memoryUsage}%</div>
                      <div className={styles.healthBar}>
                        <div 
                          className={styles.healthBarFill} 
                          style={{ width: `${systemHealth.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.healthCard}>
                    <div className={styles.healthIcon}>🔗</div>
                    <div className={styles.healthContent}>
                      <h4>Active Connections</h4>
                      <div className={styles.healthValue}>{systemHealth.activeConnections}</div>
                    </div>
                  </div>
                  <div className={styles.healthCard}>
                    <div className={styles.healthIcon}>⚡</div>
                    <div className={styles.healthContent}>
                      <h4>Response Time</h4>
                      <div className={styles.healthValue}>{systemHealth.responseTime}ms</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrated Dashboard Sections */}
            <div className={styles.dashboardSections}>
              {/* Recent Activity Section */}
              <div className={styles.activitySection}>
                <h2>📌 Recent Activity</h2>
                <div className={styles.activityList}>
                  {activityLog.length === 0 ? (
                    <div className={styles.noActivity}>
                      <div className={styles.emptyIcon}>📋</div>
                      <p>No recent activity</p>
                      <small>Activities will appear here in real-time</small>
                    </div>
                  ) : (
                    activityLog.slice(0, 5).map((log) => (
                      <div key={log.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          {log.type === 'task' && '📝'}
                          {log.type === 'admin' && '👑'}
                          {log.type === 'team' && '👥'}
                          {log.type === 'system' && '⚙️'}
                          {!['task', 'admin', 'team', 'system'].includes(log.type) && '📌'}
                        </div>
                        <div className={styles.activityContent}>
                          <div className={styles.activityAction}>{log.action}</div>
                          <div className={styles.activityMeta}>
                            <span className={styles.activityUser}>{log.user}</span>
                            <span className={styles.activityTime}>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {activityLog.length > 5 && (
                    <button 
                      className={styles.viewAllButton}
                      onClick={() => setActiveTab('system')}
                    >
                      View All Activities →
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications Section */}
              <div className={styles.notificationsSection}>
                <h2>🔔 System Alerts</h2>
                <div className={styles.notificationsList}>
                  {notifications.slice(0, 4).map((note, i) => (
                    <div key={i} className={styles.notificationItem}>
                      <div className={styles.notificationIcon}>
                        {note.includes('⚠') && '⚠️'}
                        {note.includes('✅') && '✅'}
                        {note.includes('📊') && '📊'}
                        {note.includes('🔄') && '🔄'}
                        {!['⚠', '✅', '📊', '🔄'].some(icon => note.includes(icon)) && '📢'}
                      </div>
                      <div className={styles.notificationContent}>
                        <p>{note.replace(/^[⚠✅📊🔄]\s*/, '')}</p>
                        <small>{new Date().toLocaleTimeString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={styles.usersTab}>
            <div className={styles.usersHeader}>
              <h2>👥 User Management</h2>
              <p>Manage user accounts, roles, and permissions</p>
            </div>
            
            <div className={styles.controls}>
              <div className={styles.searchSection}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as "all" | "admin" | "user")
                  }
                  className={styles.filterSelect}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="user">Users</option>
                </select>
              </div>

              <div className={styles.actionSection}>
                <button onClick={handleAddUser} className={styles.addButton}>
                  ➕ Add User
                </button>
                <button onClick={exportUsers} className={styles.exportButton}>
                  📊 Export Users
                </button>
              </div>
            </div>

            {/* Bulk Operations */}
            {selectedUsers.length > 0 && (
              <div className={styles.bulkOperations}>
                <span>Selected: {selectedUsers.length} users</span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className={styles.bulkSelect}
                >
                  <option value="">Select Action</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="delete">Delete</option>
                </select>
                <button onClick={handleBulkAction} className={styles.bulkButton}>
                  Execute
                </button>
                <button onClick={() => setSelectedUsers([])} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            )}

            {/* Users List */}
            <div className={styles.usersList}>
              {filteredUsers.map((user) => (
                <div key={user.id} className={styles.userCard}>
                  <div className={styles.userCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userEmail}>{user.email}</div>
                    <div className={styles.userName}>{user.name || "No name"}</div>
                    <div className={styles.userRole}>
                      <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {user.role}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {user.lastLogin && (
                      <div className={styles.lastLogin}>
                        Last login: {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className={styles.userActions}>
                    <button
                      onClick={() => handleEditUser(user)}
                      className={styles.editButton}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className={styles.deleteButton}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className={styles.teamsTab}>
            <div className={styles.teamsHeader}>
              <h2>🏢 Team Management</h2>
              <p>Manage teams, members, and team-based analytics</p>
            </div>
            
            <div className={styles.teamsGrid}>
              {teams.map((team) => (
                <div key={team.id} className={styles.teamCard}>
                  <div className={styles.teamHeader}>
                    <h3>{team.name}</h3>
                    <span className={styles.memberCount}>{team.members?.length || 0} members</span>
                  </div>
                  <div className={styles.teamContent}>
                    <p>{team.description || 'No description available'}</p>
                    <div className={styles.teamStats}>
                      <div className={styles.teamStat}>
                        <span className={styles.statLabel}>Tasks</span>
                        <span className={styles.statValue}>12</span>
                      </div>
                      <div className={styles.teamStat}>
                        <span className={styles.statLabel}>Completed</span>
                        <span className={styles.statValue}>8</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.teamActions}>
                    <button className={styles.viewTeamButton}>View Details</button>
                    <button className={styles.editTeamButton}>Edit Team</button>
                  </div>
                </div>
              ))}
            </div>
            
            {teams.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏢</div>
                <h3>No Teams Found</h3>
                <p>Teams will appear here when users create them</p>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className={styles.tasksTab}>
            <div className={styles.tasksHeader}>
              <h2>📋 Task Analytics</h2>
              <p>Monitor task performance and project insights</p>
            </div>
            
            {taskStats && (
              <div className={styles.taskStatsGrid}>
                <div className={styles.taskStatCard}>
                  <div className={styles.taskStatIcon}>📊</div>
                  <div className={styles.taskStatContent}>
                    <h3>Total Tasks</h3>
                    <div className={styles.taskStatNumber}>{taskStats.totalTasks}</div>
                    <div className={styles.taskStatProgress}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ width: `${(taskStats.completedTasks / taskStats.totalTasks) * 100}%` }}
                        ></div>
                      </div>
                      <span>{Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)}% Complete</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.taskStatCard}>
                  <div className={styles.taskStatIcon}>✅</div>
                  <div className={styles.taskStatContent}>
                    <h3>Completed</h3>
                    <div className={styles.taskStatNumber}>{taskStats.completedTasks}</div>
                    <div className={styles.taskStatTrend}>+{Math.floor(Math.random() * 10)} this week</div>
                  </div>
                </div>
                
                <div className={styles.taskStatCard}>
                  <div className={styles.taskStatIcon}>⏳</div>
                  <div className={styles.taskStatContent}>
                    <h3>Pending</h3>
                    <div className={styles.taskStatNumber}>{taskStats.pendingTasks}</div>
                    <div className={styles.taskStatTrend}>-{Math.floor(Math.random() * 5)} from last week</div>
                  </div>
                </div>
                
                <div className={styles.taskStatCard}>
                  <div className={styles.taskStatIcon}>🔥</div>
                  <div className={styles.taskStatContent}>
                    <h3>High Priority</h3>
                    <div className={styles.taskStatNumber}>{taskStats.highPriorityTasks}</div>
                    <div className={styles.taskStatTrend}>Needs attention</div>
                  </div>
                </div>
                
                <div className={styles.taskStatCard}>
                  <div className={styles.taskStatIcon}>⚠️</div>
                  <div className={styles.taskStatContent}>
                    <h3>Overdue</h3>
                    <div className={styles.taskStatNumber}>{taskStats.overdueTasks}</div>
                    <div className={styles.taskStatTrend}>Requires immediate action</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className={styles.taskInsights}>
              <h3>📈 Task Insights</h3>
              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <h4>Most Active Teams</h4>
                  <div className={styles.insightList}>
                    <div className={styles.insightItem}>
                      <span>Development Team</span>
                      <span className={styles.insightValue}>45 tasks</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span>Design Team</span>
                      <span className={styles.insightValue}>32 tasks</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span>Marketing Team</span>
                      <span className={styles.insightValue}>28 tasks</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.insightCard}>
                  <h4>Task Distribution</h4>
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.pieChart}>
                      <div className={styles.pieSlice} style={{background: 'conic-gradient(#10b981 0deg 180deg, #f59e0b 180deg 270deg, #ef4444 270deg 360deg)'}}></div>
                    </div>
                    <div className={styles.chartLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{backgroundColor: '#10b981'}}></span>
                        <span>Completed (57%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{backgroundColor: '#f59e0b'}}></span>
                        <span>In Progress (28%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendColor} style={{backgroundColor: '#ef4444'}}></span>
                        <span>Overdue (15%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className={styles.securityTab}>
            <div className={styles.securityHeader}>
              <h2>🔒 Security & Audit Logs</h2>
              <p>Monitor security events and system access</p>
            </div>
            
            <div className={styles.securityOverview}>
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>🛡️</div>
                <div className={styles.securityContent}>
                  <h3>Security Status</h3>
                  <div className={styles.securityStatus}>
                    <span className={styles.statusGood}>Good</span>
                    <p>No critical security issues detected</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>🔐</div>
                <div className={styles.securityContent}>
                  <h3>Failed Logins</h3>
                  <div className={styles.securityMetric}>
                    <span className={styles.metricNumber}>3</span>
                    <p>In the last 24 hours</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>👥</div>
                <div className={styles.securityContent}>
                  <h3>Active Sessions</h3>
                  <div className={styles.securityMetric}>
                    <span className={styles.metricNumber}>{systemHealth?.activeConnections || 0}</span>
                    <p>Currently online</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.securityEvents}>
              <h3>🚨 Recent Security Events</h3>
              <div className={styles.eventsList}>
                {securityEvents.map((event) => (
                  <div key={event.id} className={`${styles.eventItem} ${styles[event.severity]}`}>
                    <div className={styles.eventHeader}>
                      <span className={styles.eventType}>
                        {event.type === 'failed_login' && '🚫'}
                        {event.type === 'login_attempt' && '🔑'}
                        {event.type === 'permission_change' && '⚙️'}
                        {event.type === 'data_access' && '📊'}
                        {event.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={styles.eventTime}>
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.eventContent}>
                      <div className={styles.eventUser}>User: {event.user}</div>
                      <div className={styles.eventDetails}>{event.details}</div>
                    </div>
                    <div className={styles.eventSeverity}>
                      <span className={`${styles.severityBadge} ${styles[event.severity]}`}>
                        {event.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className={styles.systemTab}>
            <div className={styles.systemHeader}>
              <h2>⚙️ System Health & Monitoring</h2>
              <p>Real-time system performance and health metrics</p>
            </div>
            
            {systemHealth && (
              <div className={styles.systemHealthGrid}>
                <div className={styles.healthMetricCard}>
                  <div className={styles.healthIcon}>⏱️</div>
                  <div className={styles.healthContent}>
                    <h3>System Uptime</h3>
                    <div className={styles.healthValue}>{systemHealth.uptime}</div>
                    <div className={styles.healthStatus}>Excellent</div>
                  </div>
                </div>
                
                <div className={styles.healthMetricCard}>
                  <div className={styles.healthIcon}>💾</div>
                  <div className={styles.healthContent}>
                    <h3>Memory Usage</h3>
                    <div className={styles.healthValue}>{systemHealth.memoryUsage}%</div>
                    <div className={styles.healthProgressBar}>
                      <div 
                        className={styles.healthProgress} 
                        style={{ 
                          width: `${systemHealth.memoryUsage}%`,
                          backgroundColor: systemHealth.memoryUsage > 80 ? '#ef4444' : systemHealth.memoryUsage > 60 ? '#f59e0b' : '#10b981'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.healthMetricCard}>
                  <div className={styles.healthIcon}>🔗</div>
                  <div className={styles.healthContent}>
                    <h3>Active Connections</h3>
                    <div className={styles.healthValue}>{systemHealth.activeConnections}</div>
                    <div className={styles.healthStatus}>Normal</div>
                  </div>
                </div>
                
                <div className={styles.healthMetricCard}>
                  <div className={styles.healthIcon}>⚡</div>
                  <div className={styles.healthContent}>
                    <h3>Response Time</h3>
                    <div className={styles.healthValue}>{systemHealth.responseTime}ms</div>
                    <div className={styles.healthStatus}>
                      {systemHealth.responseTime < 200 ? 'Excellent' : systemHealth.responseTime < 500 ? 'Good' : 'Needs Attention'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className={styles.systemActions}>
              <h3>🛠️ System Actions</h3>
              <div className={styles.actionButtonGrid}>
                <button className={styles.systemActionButton}>
                  <span className={styles.actionIcon}>🔄</span>
                  <div className={styles.actionContent}>
                    <h4>Restart Services</h4>
                    <p>Restart system services</p>
                  </div>
                </button>
                
                <button className={styles.systemActionButton}>
                  <span className={styles.actionIcon}>🧹</span>
                  <div className={styles.actionContent}>
                    <h4>Clear Cache</h4>
                    <p>Clear system cache</p>
                  </div>
                </button>
                
                <button className={styles.systemActionButton}>
                  <span className={styles.actionIcon}>💾</span>
                  <div className={styles.actionContent}>
                    <h4>Backup Data</h4>
                    <p>Create system backup</p>
                  </div>
                </button>
                
                <button className={styles.systemActionButton}>
                  <span className={styles.actionIcon}>📊</span>
                  <div className={styles.actionContent}>
                    <h4>Generate Report</h4>
                    <p>System health report</p>
                  </div>
                </button>
              </div>
            </div>
            
            <div className={styles.systemLogs}>
              <h3>📋 System Logs</h3>
              <div className={styles.logContainer}>
                <div className={styles.logEntry}>
                  <span className={styles.logTime}>{new Date().toLocaleTimeString()}</span>
                  <span className={styles.logLevel}>INFO</span>
                  <span className={styles.logMessage}>System health check completed successfully</span>
                </div>
                <div className={styles.logEntry}>
                  <span className={styles.logTime}>{new Date(Date.now() - 300000).toLocaleTimeString()}</span>
                  <span className={styles.logLevel}>WARN</span>
                  <span className={styles.logMessage}>Memory usage approaching 70% threshold</span>
                </div>
                <div className={styles.logEntry}>
                  <span className={styles.logTime}>{new Date(Date.now() - 600000).toLocaleTimeString()}</span>
                  <span className={styles.logLevel}>INFO</span>
                  <span className={styles.logMessage}>Database connection pool optimized</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {showUserModal && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingUser.id ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowUserModal(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled={!!editingUser.id}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Name:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as "user" | "admin" })}
                  className={styles.formSelect}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowUserModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSaveUser} className={styles.saveButton}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>📈 System Analytics</h3>
              <button onClick={() => setShowAnalytics(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <h4>User Growth</h4>
                  <div className={styles.chartPlaceholder}>
                    📊 User registration trend over time
                  </div>
                </div>
                <div className={styles.analyticsCard}>
                  <h4>Activity Distribution</h4>
                  <div className={styles.chartPlaceholder}>
                    📈 Active vs Inactive users
                  </div>
                </div>
                <div className={styles.analyticsCard}>
                  <h4>Role Distribution</h4>
                  <div className={styles.chartPlaceholder}>
                    🥧 Admin vs User ratio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>⚙️ System Settings</h3>
              <button onClick={() => setShowSettings(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.settingsSection}>
                <h4>User Management</h4>
                <div className={styles.settingItem}>
                  <label>Auto-deactivate inactive users after:</label>
                  <select className={styles.formSelect}>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <label>Require email verification:</label>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
              <div className={styles.settingsSection}>
                <h4>Security</h4>
                <div className={styles.settingItem}>
                  <label>Session timeout (minutes):</label>
                  <input type="number" defaultValue="60" className={styles.formInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>Enable two-factor authentication:</label>
                  <input type="checkbox" />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowSettings(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={() => setShowSettings(false)} className={styles.saveButton}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;