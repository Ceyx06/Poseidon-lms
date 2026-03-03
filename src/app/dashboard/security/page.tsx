"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/security", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load profile");
      setName(data.name || "");
      setEmail(data.email || "");
      setImageUrl(data.imageUrl || null);
    } catch (e: any) {
      toast.error(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveName() {
    if (!name.trim()) {
      toast.error("Username is required");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/account/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update username");
      toast.success("Username updated");
      await loadProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to update username");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update password");
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function uploadProfileImage(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/profile-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to upload image");
      setImageUrl(data.imageUrl || null);
      toast.success("Profile photo updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ fontFamily: "var(--font-dm)", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: 28, color: "#0f1f3d", marginBottom: 4 }}>
          Security
        </h1>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Manage your username, password, and profile photo.
        </p>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading profile...</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#1a2d45", marginBottom: 12 }}>
              Profile Photo
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(201,151,42,0.4)",
                  background: "rgba(201,151,42,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8a6010",
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1a2d45",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d7e1ec",
                  background: uploading ? "#f8fafc" : "#fff",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadProfileImage(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>JPG, PNG, WEBP up to 2MB</span>
            </div>
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#1a2d45", marginBottom: 12 }}>
              Account Info
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>Username</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d7e1ec",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "#1a2d45",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>Email</label>
                <input
                  value={email}
                  disabled
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    background: "#f8fafc",
                    color: "#64748b",
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 14px",
                  cursor: savingName ? "not-allowed" : "pointer",
                }}
              >
                {savingName ? "Saving..." : "Save Username"}
              </button>
            </div>
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#1a2d45", marginBottom: 12 }}>
              Change Password
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d7e1ec",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d7e1ec",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d7e1ec",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={savePassword}
                disabled={savingPassword}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#c2410c",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 14px",
                  cursor: savingPassword ? "not-allowed" : "pointer",
                }}
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

