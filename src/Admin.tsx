import React from "react";

const AdminPage: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "#0a2d6e",
          color: "#fff",
          display: "flex", 
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "40px" }}>
          Admin Panel
        </h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <a href="#" style={linkStyle}>Dashboard</a>
          <a href="#" style={linkStyle}>Users</a>
          <a href="#" style={linkStyle}>Projects</a>
          <a href="#" style={linkStyle}>Settings</a>
          <a href="#" style={{ ...linkStyle, color: "#f87171" }}>Logout</a>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: "#f9fafb", padding: "20px" }}>
        {/* Topbar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              outline: "none",
              width: "250px",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: "600", color: "#0a2d6e" }}>Admin</span>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#0e3ca8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              A
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Users</h3>
            <p style={cardNumber}>120</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Projects</h3>
            <p style={cardNumber}>15</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Tasks</h3>
            <p style={cardNumber}>78</p>
          </div>
        </section>
      </main>
    </div>
  );
};

// Styles
const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#fff",
  fontWeight: 500,
  padding: "10px 14px",
  borderRadius: "6px",
  transition: "background 0.3s",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
};

const cardTitle: React.CSSProperties = {
  fontSize: "16px",
  color: "#374151",
  marginBottom: "8px",
};

const cardNumber: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#0e3ca8",
};

export default AdminPage;
