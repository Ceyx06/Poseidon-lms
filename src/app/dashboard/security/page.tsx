"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarRef = useRef<HTMLButtonElement | null>(null);

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

  async function saveAccount() {
    if (!name.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSavingAccount(true);
    try {
      const res = await fetch("/api/account/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update account info");
      toast.success("Account info updated");
      await loadProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to update account info");
    } finally {
      setSavingAccount(false);
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
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", position: "relative" }}>
              <button
                type="button"
                ref={avatarRef}
                onClick={() => {
                  if (!imageUrl || !avatarRef.current) return;
                  const rect = avatarRef.current.getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 6, left: rect.left });
                  setPreviewOpen(true);
                }}
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(201,151,42,0.35)",
                  background: "rgba(201,151,42,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8a6010",
                  fontWeight: 700,
                  fontSize: 24,
                  padding: 0,
                  cursor: imageUrl ? "pointer" : "default",
                  boxShadow: imageUrl ? "0 6px 18px rgba(0,0,0,0.08)" : "none",
                }}
                aria-label={imageUrl ? "View profile photo" : "Profile photo placeholder"}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  name?.[0]?.toUpperCase() || "U"
                )}
              </button>
              <input
                ref={fileInputRef}
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
              <span style={{ fontSize: 11, color: "#94a3b8" }}>JPG, PNG, WEBP up to 2MB</span>
            </div>
          </section>

              {previewOpen && imageUrl && menuPos && (
                <>
                  <div
                    onClick={() => setPreviewOpen(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "transparent",
                      zIndex: 9998,
                    }}
                  />
                  <div
                    style={{
                      position: "fixed",
                      top: menuPos.top,
                      left: menuPos.left,
                      zIndex: 9999,
                      background: "#0f172a",
                      color: "#e2e8f0",
                      borderRadius: 12,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                      width: 220,
                      display: "grid",
                      gap: 4,
                      padding: "6px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        window.open(imageUrl, "_blank");
                        setPreviewOpen(false);
                      }}
                      style={{
                        background: "transparent",
                        color: "#e2e8f0",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span role="img" aria-hidden>👁️</span>
                      See profile picture
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewOpen(false);
                        fileInputRef.current?.click();
                      }}
                      style={{
                        background: "transparent",
                        color: "#e2e8f0",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span role="img" aria-hidden>🖼️</span>
                      Choose profile picture
                    </button>
                  </div>
                </>
              )}

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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={saveAccount}
                disabled={savingAccount}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 14px",
                  cursor: savingAccount ? "not-allowed" : "pointer",
                }}
              >
                {savingAccount ? "Saving..." : "Save Account Info"}
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
