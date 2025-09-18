import React, { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import Footer from "./Footer";
import Profile from "./Profile";
import AdminDashboard from "./AdminDashboard";
import TeamManagement from "./TeamManagement";
import About from "./About";
import Services from "./Services";
import Contact from "./Contact";
import Login from "./Login";
import styles from "./App.module.css";

type TeamMember = {
  id: string;
  name: string;
  avatar: string;
  email: string;
};

type Task = {
  id: string;
  text: string;
  completed?: boolean;
  createdAt?: Date;
  priority?: 'high' | 'medium' | 'low';
  assignedTo?: string[];
};
type List = { id: string; title: string; tasks: Task[] };

function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Mock team members data
const mockTeamMembers = [
  { id: "user1", name: "Alex Chen", avatar: "👨‍💻", email: "alex.chen@company.com" },
  { id: "user2", name: "Maria Rodriguez", avatar: "👩‍💼", email: "maria.rodriguez@company.com" },
  { id: "user3", name: "David Kim", avatar: "👨‍🎨", email: "david.kim@company.com" },
  { id: "user4", name: "Emma Thompson", avatar: "👩‍🔬", email: "emma.thompson@company.com" },
];

// Mock system users (available to add as team members)
const mockSystemUsers = [
  { id: "sys1", name: "James Wilson", avatar: "👨‍🚀", email: "james.wilson@company.com" },
  { id: "sys2", name: "Lisa Park", avatar: "👩‍💻", email: "lisa.park@company.com" },
  { id: "sys3", name: "Robert Brown", avatar: "👨‍🔧", email: "robert.brown@company.com" },
  { id: "sys4", name: "Sophie Davis", avatar: "👩‍🎓", email: "sophie.davis@company.com" },
  { id: "sys5", name: "Michael Lee", avatar: "👨‍⚕️", email: "michael.lee@company.com" },
];


const defaultLists: List[] = [
  {
    id: generateId("list"),
    title: "Today",
    tasks: [{ id: generateId("task"), text: "Start adding Task", completed: false, assignedTo: [] }],
  },
  { id: generateId("list"), title: "This Week", tasks: [] },
  { id: generateId("list"), title: "This Month", tasks: [] },
  { id: generateId("list"), title: "Do Later", tasks: [] },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "profile"
    | "admin"
    | "teams"
    | "about"
    | "services"
    | "contact"
    | "login"
  >("login");

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
    role?: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userData = {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          role: payload.role
        };
        setCurrentUser(userData);
        setIsAuthenticated(true);
        setCurrentView('dashboard');
      } catch (error) {
        localStorage.removeItem('authToken');
        setCurrentView('login');
      }
    }

    // Listen for user data updates from HeaderMenu
    const handleUserDataUpdate = (event: CustomEvent) => {
      console.log('App: Received userDataUpdated event:', event.detail);
      setCurrentUser(event.detail);
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, []);

  const handleLogin = (userData: any) => {
    const user = userData.user || userData;
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Task Manager State
  const [lists, setLists] = useState<List[]>(defaultLists);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const dragRef = useRef<{
    listId: string;
    taskId: string;
    taskIndex: number;
  } | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'alphabetical'>('priority');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [showTeamDropdown, setShowTeamDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number}>({top: 0, left: 0});

  // Sorting function
  const sortTasks = (tasks: Task[], sortType: typeof sortBy): Task[] => {
    
    return [...tasks].sort((a, b) => {
      switch (sortType) {
        case 'alphabetical':
          return a.text.localeCompare(b.text);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
        case 'date':
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        default:
          return 0;
      }
    });
  };

  // Task Manager Functions
  const addTask = (listId: string, text: string) => {
    const newTask = { id: generateId("task"), text, completed: false, assignedTo: [] };
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, tasks: [...l.tasks, newTask] } : l
      )
    );
  };


  const toggleTaskCompletion = (listId: string, taskId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
            ...l,
            tasks: l.tasks.map((t) =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            ),
          }
          : l
      )
    );
  };


  const renameTask = (listId: string, taskId: string, newText: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
            ...l,
            tasks: l.tasks.map((t) =>
              t.id === taskId ? { ...t, text: newText } : t
            ),
          }
          : l
      )
    );
  };

  const toggleTaskPriority = (listId: string, taskId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
            ...l,
            tasks: l.tasks.map((t) =>
              t.id === taskId
                ? {
                  ...t,
                  priority: t.priority === 'high' ? 'medium' : 'high'
                }
                : t
            ),
          }
          : l
      )
    );
  };

  const assignTaskToMember = (listId: string, taskId: string, memberId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
            ...l,
            tasks: l.tasks.map((t) =>
              t.id === taskId
                ? {
                  ...t,
                  assignedTo: t.assignedTo?.includes(memberId)
                    ? t.assignedTo.filter(id => id !== memberId)
                    : [...(t.assignedTo || []), memberId]
                }
                : t
            ),
          }
          : l
      )
    );
  };

  const addTeamMember = (userId: string) => {
    const systemUser = mockSystemUsers.find(user => user.id === userId);
    if (systemUser && !teamMembers.find(member => member.id === userId)) {
      setTeamMembers(prev => [...prev, systemUser]);
    }
  };

  const removeTeamMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    // Also remove from all task assignments
    setLists(prev => 
      prev.map(list => ({
        ...list,
        tasks: list.tasks.map(task => ({
          ...task,
          assignedTo: task.assignedTo?.filter(id => id !== memberId) || []
        }))
      }))
    );
  };

  const addList = (title: string) => {
    const newList = { id: generateId("list"), title, tasks: [] };
    setLists((prev) => [...prev, newList]);
  };

  const renameList = (listId: string, newTitle: string) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, title: newTitle } : l))
    );
  };

  // Drag and Drop Functions
  const onDragStart = (listId: string, taskId: string, taskIndex: number) => {
    dragRef.current = { listId, taskId, taskIndex };
    setDraggedTaskId(taskId);
  };

  const onDragEnd = () => {
    dragRef.current = null;
    setDraggedTaskId(null);
  };

  const onDrop = (targetListId: string) => {
    if (!dragRef.current) return;
    const { listId: sourceListId, taskId } = dragRef.current;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceListId) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        }
        if (l.id === targetListId) {
          return { ...l, tasks: [...l.tasks, task] };
        }
        return l;
      })
    );
  };

  const onDropToFinished = () => {
    if (!dragRef.current) return;
    const { listId: sourceListId, taskId } = dragRef.current;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceListId) {
          return { 
            ...l, 
            tasks: l.tasks.map((t) => 
              t.id === taskId ? { ...t, completed: true } : t
            )
          };
        }
        return l;
      })
    );
  };

  const onDropBefore = (targetListId: string, targetIndex: number) => {
    if (!dragRef.current) return;
    const { listId: sourceListId, taskId, taskIndex: sourceIndex } = dragRef.current;

    const sourceList = lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLists((prev) =>
      prev.map((l) => {
        if (l.id === sourceListId) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        }
        if (l.id === targetListId) {
          const newTasks = [...l.tasks];
          const adjustedIndex =
            sourceListId === targetListId && sourceIndex < targetIndex
              ? targetIndex - 1
              : targetIndex;
          newTasks.splice(adjustedIndex, 0, task);
          return { ...l, tasks: newTasks };
        }
        return l;
      })
    );
  };

  // Profile view
  if (currentView === "profile") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
          onLogout={handleLogout}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
        <main className={styles.main}>
          <Profile onBack={() => setCurrentView("dashboard")} />
        </main>
        <Footer />
      </div>
    );
  }

  // Login view
  if (!isAuthenticated || currentView === "login") {
    return <Login onLogin={handleLogin} />;
  }

  // Admin view - only accessible to admin users
  if (currentView === "admin") {
    if (!isAdmin) {
      // Redirect non-admin users back to dashboard
      setCurrentView("dashboard");
      return null;
    }
    
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
          onLogout={handleLogout}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
        <main className={styles.main}>
          <AdminDashboard onBack={() => setCurrentView("dashboard")} />
        </main>
        <Footer />
      </div>
    );
  }

  // Teams view
  if (currentView === "teams") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
          onLogout={handleLogout}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
        {currentView === 'teams' && (
          <TeamManagement 
            currentUser={currentUser || undefined}
            teamMembers={teamMembers}
            systemUsers={mockSystemUsers}
            onAddMember={addTeamMember}
            onRemoveMember={removeTeamMember}
            tasks={lists.flatMap(list => list.tasks)}
            onAssignTask={assignTaskToMember}
            lists={lists}
          />
        )}
        <Footer />
      </div>
    );
  }

  // About view
  if (currentView === "about") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
          onLogout={handleLogout}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
        <main className={styles.main}>
          <About />
        </main>
        <Footer />
      </div>
    );
  }

  // Services view
  if (currentView === "services") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
          onLogout={handleLogout}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
        <main className={styles.main}>
          <Services />
        </main>
        <Footer />
      </div>
    );
  }

  // Contact view
  if (currentView === "contact") {
    return (
      <div className={styles.app}>
        <HeaderMenu
          onProfileClick={() => setCurrentView("profile")}
          onAdminClick={() => setCurrentView("admin")}
          onTeamsClick={() => setCurrentView("teams")}
          onAboutClick={() => setCurrentView("about")}
          onHomeClick={() => setCurrentView("dashboard")}
          onServicesClick={() => setCurrentView("services")}
          onContactClick={() => setCurrentView("contact")}
          onLogout={handleLogout}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
        <main className={styles.main}>
          <Contact />
        </main>
        <Footer />
      </div>
    );
  }

  // Default view - Task Manager as HomePage with Header Menu on top
  return (
    <div className={styles.app}>
      <HeaderMenu
        onProfileClick={() => setCurrentView("profile")}
        onAdminClick={() => setCurrentView("admin")}
        onTeamsClick={() => setCurrentView("teams")}
        onAboutClick={() => setCurrentView("about")}
        onHomeClick={() => setCurrentView("dashboard")}
        onServicesClick={() => setCurrentView("services")}
        onContactClick={() => setCurrentView("contact")}
        onLogout={handleLogout}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />
      <main className={styles.main}>
        <div className={styles.projectBoard}>
          <div className={styles.boardHeader}>
            <div className={styles.boardTitleSection}>
              <h2 className={styles.boardTitle}>✨ My Project Board</h2>
              <p className={styles.boardSubtitle}>Organize and track your tasks efficiently</p>
            </div>
            <div className={styles.boardStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{lists.reduce((acc, list) => acc + list.tasks.length, 0)}</span>
                <span className={styles.statLabel}>Total Tasks</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{lists.reduce((acc, list) => acc + list.tasks.filter(t => t.completed).length, 0)}</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
            </div>
            <div className={styles.sortControls}>
              <label htmlFor="sortSelect" className={styles.sortLabel}>Sort by:</label>
              <select 
                id="sortSelect"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="none">Default</option>
                <option value="alphabetical">A-Z</option>
                <option value="priority">Priority</option>
                <option value="date">Date Created</option>
              </select>
            </div>
          </div>
          <div className={styles.boardContainer}>
          {lists.map((list) => (
            <div key={list.id} className={styles.boardColumn} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(list.id)}>
              <div className={styles.columnHeader}>
                <div className={styles.columnTitle}>
                  <input
                    className={styles.columnTitleInput}
                    value={list.title}
                    onChange={(e) => renameList(list.id, e.target.value)}
                  />
                  <div className={styles.columnActions}>
                    <button
                      className={styles.columnButton}
                      onClick={() => {
                        const taskText = prompt("Enter task:");
                        if (taskText) addTask(list.id, taskText);
                      }}
                    >
                      ➕ Add
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.columnContent}>
                {sortTasks(list.tasks, sortBy).map((task, index) => (
                  <div
                    key={task.id}
                    className={`${styles.taskCard} ${draggedTaskId === task.id ? styles.dragging : ""
                      }`}
                    draggable
                    onDragStart={() => onDragStart(list.id, task.id, index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropBefore(list.id, index)}
                  >
                    <div className={styles.taskCardHeader}>
                      <div className={styles.taskCheckbox}>
                        <button
                          className={`${styles.checkButton} ${task.completed ? styles.checked : ''}`}
                          onClick={() => toggleTaskCompletion(list.id, task.id)}
                        >
                          {task.completed ? '✓' : ''}
                        </button>
                      </div>
                      <input
                        className={`${styles.taskCardTitle} ${task.completed ? styles.completed : ''}`}
                        value={task.text}
                        onChange={(e) =>
                          renameTask(list.id, task.id, e.target.value)
                        }
                      />
                    </div>
                    <div className={styles.taskCardContent}>
                      <p className={styles.taskDescription}>
                        Task details and description
                      </p>
                      <div className={styles.taskProgress}>
                        <div className={styles.progressBar}></div>
                      </div>
                    </div>
                    <div className={styles.taskCardActions}>
                      <div className={styles.teamSection}>
                        <div className={styles.assignedMembers}>
                          {task.assignedTo?.map(memberId => {
                            const member = teamMembers.find(m => m.id === memberId);
                            return member ? (
                              <span key={memberId} className={styles.memberAvatar} title={member.name}>
                                {member.avatar}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className={styles.taskActions}>
                        <button
                          className={`${styles.starButton} ${task.priority === 'high' ? styles.starred : ''}`}
                          onClick={() => toggleTaskPriority(list.id, task.id)}
                          title={task.priority === 'high' ? 'Remove from priority' : 'Mark as priority'}
                        >
                          {task.priority === 'high' ? '⭐' : '☆'}
                        </button>
                        <div className={styles.teamAssignmentContainer}>
                          <button 
                            className={styles.assignButton}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({
                                top: rect.bottom + window.scrollY + 5,
                                left: rect.right - 320 + window.scrollX
                              });
                              setShowTeamDropdown(showTeamDropdown === task.id ? null : task.id);
                            }}
                            title="Assign to team member"
                          >
                            <span>👥</span>
                            <span>Team</span>
                            {task.assignedTo && task.assignedTo.length > 0 && (
                              <span className={styles.assignedCount}>
                                {task.assignedTo.length}
                              </span>
                            )}
                          </button>
                          
                          {/* Team Assignment Dropdown */}
                          {showTeamDropdown === task.id && (
                            <div 
                              className={styles.teamDropdown}
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left
                              }}
                            >
                              <div className={styles.dropdownHeader}>
                                <span>Assign to Team Members</span>
                                <button 
                                  className={styles.closeDropdown}
                                  onClick={() => setShowTeamDropdown(null)}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className={styles.membersList}>
                                {teamMembers.map(member => (
                                  <div 
                                    key={member.id} 
                                    className={`${styles.memberOption} ${
                                      task.assignedTo?.includes(member.id) ? styles.assigned : ''
                                    }`}
                                    onClick={() => assignTaskToMember(list.id, task.id, member.id)}
                                  >
                                    <div className={styles.memberInfo}>
                                      <span className={styles.memberAvatar}>{member.avatar}</span>
                                      <div className={styles.memberDetails}>
                                        <span className={styles.memberName}>{member.name}</span>
                                        <span className={styles.memberEmail}>{member.email}</span>
                                      </div>
                                    </div>
                                    <div className={styles.assignmentStatus}>
                                      {task.assignedTo?.includes(member.id) ? (
                                        <span className={styles.assignedIcon}>✓</span>
                                      ) : (
                                        <span className={styles.unassignedIcon}>+</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {task.assignedTo && task.assignedTo.length > 0 && (
                                <div className={styles.assignedMembersPreview}>
                                  <span className={styles.previewLabel}>Assigned to:</span>
                                  <div className={styles.assignedAvatars}>
                                    {task.assignedTo.map(memberId => {
                                      const member = teamMembers.find(m => m.id === memberId);
                                      return member ? (
                                        <span 
                                          key={memberId} 
                                          className={styles.assignedAvatar}
                                          title={member.name}
                                        >
                                          {member.avatar}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.addColumnButton}>
            <ListComposer onAdd={(title) => addList(title)} />
          </div>
          </div>
        </div>
        
        <div 
          className={styles.finishedTasksPanel}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropToFinished}
        >
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Finished Tasks</h3>
          </div>
          <div className={styles.panelContent}>
            {lists.flatMap(l => l.tasks).filter(t => t.completed).length === 0 ? (
              <p className={styles.noTasksMessage}>No finished tasks yet</p>
            ) : (
              lists.flatMap(l => l.tasks).filter(t => t.completed).map(task => (
                <div key={task.id} className={styles.finishedTask}>
                  <span className={styles.finishedTaskText}>{task.text}</span>
                  <span className={styles.checkIcon}>✓</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};


const ListComposer: React.FC<{ onAdd: (title: string) => void }> = ({
  onAdd,
}) => {
  const [title, setTitle] = useState("");
  return (
    <div className={styles.listComposer}>
      <input
        className={styles.listInput}
        placeholder="Add another list"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            onAdd(title);
            setTitle("");
          }
        }}
      />
      <button
        className={styles.addList}
        onClick={() => {
          if (title.trim()) {
            onAdd(title);
            setTitle("");
          }
        }}
      >
        + Add List
      </button>
    </div>
  );
};

export default App;
