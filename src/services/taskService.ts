export async function getTeamTasks(teamId: string) {
  const res = await fetch(`/api/tasks/team/${teamId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
  return await res.json();
}

export async function createTask(teamId: string, data: any) {
  const res = await fetch(`/api/tasks/team/${teamId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function updateTask(taskId: string, data: any) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function deleteTask(taskId: string) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  });
  return await res.json();
}