import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TeamTasks.module.css";
import type { Team, TeamTask } from "./types/team";
import { getTeamTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from "./services/taskService";

interface TeamTasksProps {
  team: Team;
  currentUser: { id: string; email: string; name?: string };
  onBack: () => void;
}

const TeamTasks: React.FC<TeamTasksProps> = ({ team, currentUser, onBack }) => {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedTask, setDraggedTask] = useState<TeamTask | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'title'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTasks();
  }, [team.id]);

  useEffect(() => {
    // Join the team board room when component mounts
    window.dispatchEvent(new CustomEvent("joinTeamBoard", { detail: { teamId: team.id } }));

    // Listen for board updates (from server)
    const boardHandler = (e: any) => {
      // Reload tasks or update board state
      loadTasks();
    };
    window.addEventListener("teamBoardUpdated", boardHandler);

    // Listen for local task updates (from other tabs/users)
    const localHandler = (e: any) => {
      if (e.detail.teamId === team.id) {
        loadTasks();
      }
    };
    window.addEventListener("teamTasksUpdated", localHandler);

    return () => {
      window.removeEventListener("teamBoardUpdated", boardHandler);
      window.removeEventListener("teamTasksUpdated", localHandler);
    };
  }, [team.id]);

  const loadTasks = async () => {
    const apiTasks = await getTeamTasks(team.id);
    setTasks(apiTasks.map(task => ({ ...task, id: task.id || task._id })));
  };

  const saveTasks = (updatedTasks: TeamTask[]) => {
    setTasks(updatedTasks);
    try {
      window.dispatchEvent(new CustomEvent('teamTasksUpdated', { detail: { teamId: team.id } }));
    } catch {}
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      assignedTo: currentUser.id,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    await apiCreateTask(team.id, newTask);
    loadTasks();
    setNewTaskTitle("");
    setNewTaskDescription("");
    setShowCreateForm(false);
  };

  const updateTaskStatus = useCallback((taskId: string, status: TeamTask['status']) => {
    // Optimistic update for better UX
    setTasks(prevTasks => 
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task
      )
    );
    
    // API call with error handling
    apiUpdateTask(taskId, { status }).catch(() => {
      // Revert on error
      loadTasks();
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    // Optimistic update
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    // API call with error handling
    apiDeleteTask(taskId).catch(() => {
      // Revert on error
      loadTasks();
    });
  }, []);

  // Optimized task filtering and sorting with memoization
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });

    // Sort tasks based on selected criteria
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [tasks, searchTerm, priorityFilter, sortBy, sortOrder]);

  const getTasksByStatus = useCallback((status: TeamTask['status']) => {
    return filteredAndSortedTasks.filter(task => task.status === status);
  }, [filteredAndSortedTasks]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, task: TeamTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: TeamTask['status']) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== targetStatus) {
      updateTaskStatus(draggedTask.id, targetStatus);
    }
    setDraggedTask(null);
  }, [draggedTask]);

  const getPriorityColor = (priority: TeamTask['priority']) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'low': return '#66bb6a';
      default: return '#9ca3af';
    }
  };

  const getStatusColor = (status: TeamTask['status']) => {
    switch (status) {
      case 'todo': return '#9ca3af';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#9ca3af';
    }
  };

  return (
    <div className={styles.teamTasksContainer}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Teams
        </button>
        <div className={styles.teamInfo}>
          <h1>{team.name} - Team Tasks</h1>
          <p>{team.description}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={styles.createTaskButton}
        >
          ➕ Create Task
        </button>
        
        <div className={styles.boardControls}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="created">Sort by Created</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={styles.sortOrderButton}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className={styles.createTaskForm}>
          <h3>Create New Task</h3>
          <div className={styles.formGroup}>
            <label>Task Title *</label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className={styles.formInput}
              placeholder="Enter task title"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className={styles.formTextarea}
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowCreateForm(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={createTask} className={styles.createButton}>
              Create Task
            </button>
          </div>
        </div>
      )}

      <div className={styles.kanbanBoard}>
        <div 
          className={styles.column}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'todo')}
        >
          <h3 className={styles.columnTitle}>To Do ({getTasksByStatus('todo').length})</h3>
          <div className={styles.taskList}>
            {getTasksByStatus('todo').map(task => (
              <div 
                key={task.id} 
                className={`${styles.taskCard} ${draggedTask?.id === task.id ? styles.dragging : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
              >
                <div className={styles.taskHeader}>
                  <div className={styles.dragHandle}>⋮⋮</div>
                  <h4>{task.title}</h4>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className={styles.taskDescription}>{task.description}</p>
                )}
                <div className={styles.taskMeta}>
                  <small>Created: {new Date(task.createdAt).toLocaleDateString()}</small>
                </div>
                <div className={styles.taskActions}>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'in-progress')}
                    className={styles.actionButton}
                  >
                    Start
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {getTasksByStatus('todo').length === 0 && (
              <div className={styles.emptyColumn}>
                <p>No tasks in To Do</p>
                <small>Drag tasks here or create new ones</small>
              </div>
            )}
          </div>
        </div>

        <div 
          className={styles.column}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in-progress')}
        >
          <h3 className={styles.columnTitle}>In Progress ({getTasksByStatus('in-progress').length})</h3>
          <div className={styles.taskList}>
            {getTasksByStatus('in-progress').map(task => (
              <div 
                key={task.id} 
                className={`${styles.taskCard} ${styles.inProgress} ${draggedTask?.id === task.id ? styles.dragging : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
              >
                <div className={styles.taskHeader}>
                  <div className={styles.dragHandle}>⋮⋮</div>
                  <h4>{task.title}</h4>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className={styles.taskDescription}>{task.description}</p>
                )}
                <div className={styles.taskMeta}>
                  <small>Created: {new Date(task.createdAt).toLocaleDateString()}</small>
                </div>
                <div className={styles.taskActions}>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                    className={styles.actionButton}
                  >
                    Complete
                  </button>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'todo')}
                    className={styles.actionButton}
                  >
                    Back to Todo
                  </button>
                </div>
              </div>
            ))}
            {getTasksByStatus('in-progress').length === 0 && (
              <div className={styles.emptyColumn}>
                <p>No tasks in progress</p>
                <small>Drag tasks here to start working</small>
              </div>
            )}
          </div>
        </div>

        <div 
          className={styles.column}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'completed')}
        >
          <h3 className={styles.columnTitle}>Completed ({getTasksByStatus('completed').length})</h3>
          <div className={styles.taskList}>
            {getTasksByStatus('completed').map(task => (
              <div 
                key={task.id} 
                className={`${styles.taskCard} ${styles.completed} ${draggedTask?.id === task.id ? styles.dragging : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
              >
                <div className={styles.taskHeader}>
                  <div className={styles.dragHandle}>⋮⋮</div>
                  <h4>{task.title}</h4>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className={styles.taskDescription}>{task.description}</p>
                )}
                <div className={styles.taskMeta}>
                  <small>Completed: {new Date(task.updatedAt).toLocaleDateString()}</small>
                </div>
                <div className={styles.taskActions}>
                  <button 
                    onClick={() => updateTaskStatus(task.id, 'in-progress')}
                    className={styles.actionButton}
                  >
                    Reopen
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {getTasksByStatus('completed').length === 0 && (
              <div className={styles.emptyColumn}>
                <p>No completed tasks</p>
                <small>Complete tasks to see them here</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamTasks;
