import type { Team, CreateTeamData } from '../types/team';

// Only use API-based functions
export async function getAllTeams() {
  const res = await fetch("/api/teams", { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
  return await res.json();
}

export async function getUserTeams(userId: string) {
  const res = await fetch("/api/teams/mine", { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
  return await res.json();
}

export async function createTeam(userId: string, email: string, data: any) {
  const res = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function joinTeam(userId: string, email: string, teamId: string) {
  const res = await fetch(`/api/teams/${teamId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  });
  return await res.json();
}
