import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Login from "./Login";
import Admin from "./AdminDashboard";
import { io } from "socket.io-client";
import "./index.css"; // optional global styles
import { socket } from "./services/socketService";

declare global {
  interface Window {
    socket: typeof socket;
  }
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container missing in index.html");
}

const root = ReactDOM.createRoot(container as HTMLElement);

function Root() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    if (!authed) return;

    window.socket = socket;

    // Listen for team creation
    socket.on("team:created", (team: any) => {
      window.dispatchEvent(new CustomEvent("teamCreated", { detail: team }));
    });

    // Listen for team updates (join, leave, etc.)
    socket.on("team:updated", (team: any) => {
      window.dispatchEvent(new CustomEvent("teamUpdated", { detail: team }));
    });

    // (Optional) Listen for global activity events
    socket.on("activity:new", (activity: any) => {
      window.dispatchEvent(new CustomEvent("activityNew", { detail: activity }));
    });

    // Fetch current user id to join room
    (async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const txt = await res.text();
        const me = txt ? JSON.parse(txt) : null;
        if (me && me.id) {
          socket.emit("register", me.id);
        }
      } catch {}
    })();

    socket.on("ping", (payload: any) => {
      alert(`Ping from ${payload.from}: ${payload.message}`);
    });
    socket.on("msg:new", (payload: any) => {
      const event = new CustomEvent("socket:msg", { detail: payload });
      window.dispatchEvent(event);
    });

    return () => {
      socket.close();
    };
  }, [authed]);
  return (
    <React.StrictMode>
      {authed ? <App /> : <Login onSuccess={() => setAuthed(true)} />}
    </React.StrictMode>
  );
}

window.socket = socket; // Make available globally

root.render(<Root />);
