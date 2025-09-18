import React, { useState, useEffect } from "react";
import styles from "./TeamManagement.module.css";
import { getAllTeams, getUserTeams, createTeam, joinTeam } from "./services/teamService";
import TeamTasks from "./TeamTasks";
import type { Team, CreateTeamData } from "./types/team";

interface TeamManagementProps {
  currentUser?: { id: string; email: string; name?: string };
  teamMembers?: Array<{ id: string; name: string; avatar: string; email: string }>;
  systemUsers?: Array<{ id: string; name: string; avatar: string; email: string }>;
  onAddMember?: (userId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  tasks?: Array<{ id: string; text: string; assignedTo?: string[]; priority?: string; completed?: boolean }>;
  onAssignTask?: (listId: string, taskId: string, memberId: string) => void;
  lists?: Array<{ id: string; title: string; tasks: any[] }>;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ 
  currentUser, 
  teamMembers = [], 
  systemUsers = [], 
  onAddMember, 
  onRemoveMember, 
  tasks = [], 
  onAssignTask, 
  lists = [] 
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamTasks, setShowTeamTasks] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinMethod, setJoinMethod] = useState<'id' | 'available'>('available');

  // Create team form state
  const [createForm, setCreateForm] = useState<CreateTeamData>({
    name: "",
    description: "",
    settings: {
      allowMemberInvites: true,
      allowTaskCreation: true,
      allowTaskAssignment: true,
      maxMembers: 10,
      visibility: 'public'
    }
  });

  // Join team form state
  const [joinTeamId, setJoinTeamId] = useState("");

  const loadTeams = async () => {
    try {
      const allTeams = await getAllTeams();
      setTeams(allTeams);
      
      if (currentUser?.id) {
        const myTeams = await getUserTeams(currentUser.id);
        setUserTeams(myTeams);
      }
    } catch (e) {
      console.error("Failed to load teams:", e);
    }
  };

  useEffect(() => {
    loadTeams();

    function handleTeamChange() {
      loadTeams();
    }
    window.addEventListener("teamCreated", handleTeamChange);
    window.addEventListener("teamUpdated", handleTeamChange);

    return () => {
      window.removeEventListener("teamCreated", handleTeamChange);
      window.removeEventListener("teamUpdated", handleTeamChange);
    };
  }, []);

  const handleCreateTeam = async () => {
    if (!currentUser?.id || !currentUser?.email) {
      setError("User not authenticated");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createTeam(currentUser.id, currentUser.email, createForm);
      setSuccess(`Team "${result.team.name}" created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ 
        name: "", 
        description: "", 
        settings: {
          allowMemberInvites: true,
          allowTaskCreation: true,
          allowTaskAssignment: true,
          maxMembers: 10,
          visibility: 'public'
        }
      });
      loadTeams();
    } catch (e) {
      setError("Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!currentUser?.id || !currentUser?.email) {
      setError("User not authenticated");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await joinTeam(currentUser.id, currentUser.email, joinTeamId);
      if (result.ok) {
        setSuccess("Successfully joined the team");
        setShowJoinModal(false);
        setJoinTeamId("");
        loadTeams();
      } else {
        setError(result.message || "Failed to join team");
      }
    } catch (e) {
      setError("Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFromAvailable = (teamId: string) => {
    setJoinTeamId(teamId);
    setJoinMethod('available');
    setShowJoinModal(true);
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to leave this team?")) return;

    try {
      // TODO: Implement leaveTeam functionality
      console.log('Leave team functionality not implemented yet');
      const result = { success: false, message: 'Leave team functionality not implemented yet' };
      console.log('Attempting to leave team:', teamId);
      
      if (result.success) {
        setSuccess(result.message);
        loadTeams();
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError("Failed to leave team");
    }
  };

  const getTeamRole = (team: Team) => {
    if (!currentUser?.id) return 'member';
    const member = team.members.find(m => m.userId === currentUser.id);
    return member?.role || 'non-member';
  };

  const isTeamMember = (team: Team) => {
    if (!currentUser?.id) return false;
    return team.members.some(member => member.userId === currentUser.id && member.isActive);
  };

  const copyTeamId = (teamId: string) => {
    navigator.clipboard.writeText(teamId);
    setSuccess(`Team ID copied to clipboard: ${teamId}`);
  };

  // Team collaboration functions
  const handleAddMember = (userId: string) => {
    if (onAddMember) {
      onAddMember(userId);
      setSuccess('Member added to team successfully!');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (onRemoveMember) {
      onRemoveMember(memberId);
      setSuccess('Member removed from team successfully!');
    }
  };

  const handleAssignTask = (listId: string, taskId: string, memberId: string) => {
    if (onAssignTask) {
      onAssignTask(listId, taskId, memberId);
      setSuccess('Task assignment updated!');
    }
  };

  const getAvailableUsers = () => {
    return systemUsers.filter(user => 
      !teamMembers.some(member => member.id === user.id) &&
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getTasksForMember = (memberId: string) => {
    return tasks.filter(task => task.assignedTo?.includes(memberId));
  };

  // Show team tasks view
  if (showTeamTasks && selectedTeam) {
    return (
      <TeamTasks 
        team={selectedTeam}
        currentUser={currentUser!}
        onBack={() => setShowTeamTasks(false)}
      />
    );
  }

  return (
    <div className={styles.teamContainer}>
      <div className={styles.header}>
        <h1>Team Management</h1>
        <p className={styles.subtitle}>Manage your teams and collaborate with others</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.actions}>
        <button 
          onClick={() => setShowCreateModal(true)}
          className={styles.createButton}
        >
          ➕ Create Team
        </button>
        <button 
          onClick={() => {
            setJoinMethod('id');
            setShowJoinModal(true);
          }}
          className={styles.joinButton}
        >
          🔗 Join by ID
        </button>
        <button 
          onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
          className={styles.collaborationButton}
        >
          👥 Team Collaboration
        </button>
        <button 
          onClick={() => setShowMemberManagement(!showMemberManagement)}
          className={styles.managementButton}
        >
          ⚙️ Manage Members
        </button>
      </div>

      {/* My Teams Section - Optimized Layout */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>My Teams ({userTeams.length})</h2>
          <p className={styles.sectionDescription}>
            Teams you're currently a member of. Click on tasks to manage team projects.
          </p>
        </div>
        <div className={styles.teamsGrid}>
          {userTeams.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>No teams yet</h3>
              <p>Create a new team or join an existing one to get started!</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className={styles.primaryButton}
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            userTeams.map(team => (
              <div key={team.id} className={styles.teamCard}>
                <div className={styles.teamHeader}>
                  <h3>{team.name}</h3>
                  <div className={styles.teamBadges}>
                    <span className={`${styles.roleBadge} ${styles[getTeamRole(team)]}`}>
                      {getTeamRole(team)}
                    </span>
                    <span className={styles.visibilityBadge}>
                      {team.settings.visibility}
                    </span>
                  </div>
                </div>
                <p className={styles.teamDescription}>{team.description}</p>
                <div className={styles.teamStats}>
                  <span>👥 {team.members.length}/{team.settings.maxMembers} members</span>
                  <span>📅 Created {new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.teamActions}>
                  <button 
                    onClick={() => setSelectedTeam(team)}
                    className={styles.viewButton}
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowTeamTasks(true);
                    }}
                    className={styles.tasksButton}
                  >
                    📋 Team Tasks
                  </button>
                  <button 
                    onClick={() => copyTeamId(team.id)}
                    className={styles.copyButton}
                    title="Copy Team ID"
                  >
                    📋 Copy ID
                  </button>
                  {getTeamRole(team) !== 'owner' && (
                    <button 
                      onClick={() => handleLeaveTeam(team.id)}
                      className={styles.leaveButton}
                    >
                      Leave Team
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Teams Section - Optimized */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Available Teams ({teams.filter(t => !isTeamMember(t)).length})</h2>
          <p className={styles.sectionDescription}>
            Public teams you can join. Click "Join Team" to become a member.
          </p>
        </div>
        <div className={styles.teamsGrid}>
          {teams.filter(team => !isTeamMember(team)).length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No available teams</h3>
              <p>All public teams are full or you're already a member.</p>
            </div>
          ) : (
            teams.filter(team => !isTeamMember(team)).map(team => (
              <div key={team.id} className={styles.teamCard}>
                <div className={styles.teamHeader}>
                  <h3>{team.name}</h3>
                  <div className={styles.teamBadges}>
                    <span className={styles.visibilityBadge}>
                      {team.settings.visibility}
                    </span>
                    <span className={styles.memberCountBadge}>
                      {team.members.length}/{team.settings.maxMembers}
                    </span>
                  </div>
                </div>
                <p className={styles.teamDescription}>{team.description}</p>
                <div className={styles.teamStats}>
                  <span>👥 {team.members.length} members</span>
                  <span>📅 Created {new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.teamActions}>
                  <button 
                    onClick={() => handleJoinFromAvailable(team.id)}
                    className={styles.joinButton}
                  >
                    Join Team
                  </button>
                  <button 
                    onClick={() => copyTeamId(team.id)}
                    className={styles.copyButton}
                    title="Copy Team ID"
                  >
                    📋 Copy ID
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Team Collaboration Panel */}
      {showCollaborationPanel && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Team Collaboration</h2>
            <p className={styles.sectionDescription}>
              Manage team members and assign tasks to collaborate effectively.
            </p>
          </div>
          
          <div className={styles.collaborationContent}>
            {/* Current Team Members */}
            <div className={styles.collaborationCard}>
              <h3>Current Team Members ({teamMembers.length})</h3>
              <div className={styles.membersList}>
                {teamMembers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No team members yet. Add members to start collaborating!</p>
                  </div>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} className={styles.memberItem}>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberAvatar}>
                          {member.avatar}
                        </div>
                        <div className={styles.memberDetails}>
                          <span className={styles.memberName}>{member.name}</span>
                          <span className={styles.memberEmail}>{member.email}</span>
                          <span className={styles.taskCount}>
                            {getTasksForMember(member.id).length} tasks assigned
                          </span>
                        </div>
                      </div>
                      <div className={styles.memberActions}>
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className={styles.removeButton}
                          title="Remove member"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Task Assignment */}
            <div className={styles.collaborationCard}>
              <h3>Task Assignment</h3>
              <div className={styles.taskAssignment}>
                {lists.map(list => (
                  <div key={list.id} className={styles.listSection}>
                    <h4>{list.title}</h4>
                    <div className={styles.tasksList}>
                      {list.tasks.map(task => (
                        <div key={task.id} className={styles.taskItem}>
                          <div className={styles.taskInfo}>
                            <span className={styles.taskText}>{task.text}</span>
                            <div className={styles.assignedMembers}>
                              {task.assignedTo?.map((memberId: string) => {
                                const member = teamMembers.find(m => m.id === memberId);
                                return member ? (
                                  <span key={memberId} className={styles.assignedMember}>
                                    {member.avatar} {member.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div className={styles.assignActions}>
                            <select 
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignTask(list.id, task.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className={styles.assignSelect}
                            >
                              <option value="">Assign to...</option>
                              {teamMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Management Panel */}
      {showMemberManagement && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Member Management</h2>
            <p className={styles.sectionDescription}>
              Add new members to your team from available users.
            </p>
          </div>
          
          <div className={styles.memberManagement}>
            {/* Search Users */}
            <div className={styles.searchSection}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Available Users */}
            <div className={styles.availableUsers}>
              <h3>Available Users</h3>
              <div className={styles.usersList}>
                {getAvailableUsers().length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No available users found.</p>
                  </div>
                ) : (
                  getAvailableUsers().map(user => (
                    <div key={user.id} className={styles.userItem}>
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          {user.avatar}
                        </div>
                        <div className={styles.userDetails}>
                          <span className={styles.userName}>{user.name}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddMember(user.id)}
                        className={styles.addButton}
                      >
                        Add to Team
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create New Team</h3>
              <button onClick={() => setShowCreateModal(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Team Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter team name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className={styles.formTextarea}
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Max Members</label>
                <input
                  type="number"
                  value={createForm.settings.maxMembers}
                  onChange={(e) => setCreateForm({
                    ...createForm, 
                    settings: {...createForm.settings, maxMembers: parseInt(e.target.value) || 10}
                  })}
                  className={styles.formInput}
                  min="2"
                  max="50"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Visibility</label>
                <select
                  value={createForm.settings.visibility}
                  onChange={(e) => setCreateForm({
                    ...createForm, 
                    settings: {...createForm.settings, visibility: e.target.value as 'public' | 'private'}
                  })}
                  className={styles.formSelect}
                >
                  <option value="public">Public (visible to everyone)</option>
                  <option value="private">Private (invite only)</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleCreateTeam} className={styles.createButton} disabled={loading}>
                {loading ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Join Team</h3>
              <button onClick={() => setShowJoinModal(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.joinMethodSelector}>
                <button 
                  className={`${styles.methodButton} ${joinMethod === 'available' ? styles.active : ''}`}
                  onClick={() => setJoinMethod('available')}
                >
                  Browse Available Teams
                </button>
                <button 
                  className={`${styles.methodButton} ${joinMethod === 'id' ? styles.active : ''}`}
                  onClick={() => setJoinMethod('id')}
                >
                  Enter Team ID
                </button>
              </div>
              
              {joinMethod === 'id' ? (
                <div className={styles.formGroup}>
                  <label>Team ID *</label>
                  <input
                    type="text"
                    value={joinTeamId}
                    onChange={(e) => setJoinTeamId(e.target.value)}
                    className={styles.formInput}
                    placeholder="Enter team ID"
                  />
                  <small>Ask the team owner for the team ID</small>
                </div>
              ) : (
                <div className={styles.availableTeamsList}>
                  <h4>Select a team to join:</h4>
                  {teams.filter(team => !isTeamMember(team)).map(team => (
                    <div key={team.id} className={styles.availableTeamItem}>
                      <div className={styles.teamInfo}>
                        <h5>{team.name}</h5>
                        <p>{team.description}</p>
                        <span className={styles.teamMeta}>
                          {team.members.length}/{team.settings.maxMembers} members • {team.settings.visibility}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleJoinFromAvailable(team.id)}
                        className={styles.joinTeamButton}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowJoinModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              {joinMethod === 'id' && (
                <button onClick={handleJoinTeam} className={styles.joinButton} disabled={loading}>
                  {loading ? "Joining..." : "Join Team"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{selectedTeam.name}</h3>
              <button onClick={() => setSelectedTeam(null)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.teamDetails}>
                <p><strong>Description:</strong> {selectedTeam.description}</p>
                <p><strong>Created:</strong> {new Date(selectedTeam.createdAt).toLocaleString()}</p>
                <p><strong>Members:</strong> {selectedTeam.members.length}/{selectedTeam.settings.maxMembers}</p>
                <p><strong>Visibility:</strong> {selectedTeam.settings.visibility}</p>
                <p><strong>Team ID:</strong> <code>{selectedTeam.id}</code></p>
              </div>
              
              <div className={styles.membersList}>
                <h4>Team Members</h4>
                {selectedTeam.members.map(member => (
                  <div key={member.userId} className={styles.memberItem}>
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberEmail}>{member.email}</span>
                    </div>
                    <span className={`${styles.roleBadge} ${styles[member.role]}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setSelectedTeam(null)} className={styles.cancelButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
