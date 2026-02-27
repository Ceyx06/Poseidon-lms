export default function Page() {
  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
            👤 JM Global Resumes
          </h1>
          <p style={{ fontSize: "13px", color: "#6a85a0" }}>POSEIDON-JM Global crew resumes</p>
        </div>
        <button style={{ fontSize: "13px", padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold", letterSpacing: "0.05em" }}>
          + Upload Document
        </button>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input
            placeholder="Search crew name..."
            style={{ flex: 1, padding: "10px 16px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none" }}
          />
          <select style={{ padding: "10px 16px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#6a85a0", background: "#f8fafc", outline: "none" }}>
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
          </select>
        </div>

        <div style={{ textAlign: "center", padding: "60px 20px", color: "#a0b0c0" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>👤</div>
          <p style={{ fontSize: "16px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No Records Yet</p>
          <p style={{ fontSize: "13px", marginBottom: "24px" }}>POSEIDON-JM Global crew resumes. Upload the first document to get started.</p>
          <button style={{ fontSize: "13px", padding: "10px 24px", borderRadius: "12px", background: "rgba(16,184,164,0.08)", color: "#0d8a7a", border: "1px solid rgba(16,184,164,0.25)", cursor: "pointer" }}>
            + Upload First Document
          </button>
        </div>
      </div>
    </div>
  );
}
