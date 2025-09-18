export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isActive: boolean;
}

export interface TeamSettings {
  allowMemberInvites: boolean;
  allowTaskCreation: boolean;
  allowTaskAssignment: boolean;
  maxMembers: number;
  visibility: 'public' | 'private';
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMember[];
  settings: TeamSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamData {
  name: string;
  description: string;
  settings: TeamSettings;
}

export interface JoinTeamResult {
  success: boolean;
  message: string;
  team?: Team;
}

export interface TeamTask {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
