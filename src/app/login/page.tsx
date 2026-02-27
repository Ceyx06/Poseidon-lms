// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      toast.error("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      toast.success("Welcome to Poseidon IMS!");
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: "#f0f4f8" }}>

      {/* ── Left Panel — Light with branding ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center px-16 overflow-hidden">

        {/* Light background with subtle ocean feel */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #e8f0fb 0%, #dce8f5 50%, #cddcee 100%)" }} />

        {/* Subtle wave pattern */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, rgba(13,138,122,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,151,42,0.10) 0%, transparent 50%)",
          }}
        />

        {/* Decorative corners */}
        <div className="absolute top-8 left-8 w-20 h-20 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: "rgba(201,151,42,0.4)" }} />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: "rgba(201,151,42,0.4)" }} />
        <div className="absolute top-8 right-8 w-10 h-10 border-t border-r rounded-tr-xl" style={{ borderColor: "rgba(201,151,42,0.25)" }} />
        <div className="absolute bottom-8 left-8 w-10 h-10 border-b border-l rounded-bl-xl" style={{ borderColor: "rgba(201,151,42,0.25)" }} />

        {/* Content */}
        <div className="relative z-10 text-center">

          {/* Logo — clear on light background */}
          <div className="relative mx-auto mb-8 w-52 h-52 fade-in">
            {/* Subtle white card behind logo */}
            <div className="absolute inset-0 rounded-full bg-white/70"
              style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(201,151,42,0.2)" }} />
            <img
              src="/poseidon-logo.png"
              alt="Poseidon International Maritime Services"
              className="relative z-10 w-full h-full object-contain p-3"
            />
          </div>

          {/* Company name */}
          <div className="fade-up-delay-1">
            <h1 className="font-cinzel font-black text-4xl tracking-[0.12em] uppercase leading-tight mb-1"
              style={{ color: "#8a6010" }}>
              Poseidon
            </h1>
            <h2 className="font-cinzel font-semibold text-sm tracking-[0.22em] uppercase mb-1"
              style={{ color: "#3a5a7a" }}>
              International Maritime
            </h2>
            <h2 className="font-cinzel font-semibold text-sm tracking-[0.22em] uppercase"
              style={{ color: "#3a5a7a" }}>
              Services, Inc.
            </h2>
          </div>

          {/* Divider */}
          <div className="my-7 fade-up-delay-2 flex items-center gap-4 justify-center">
            <div className="h-px w-16" style={{ background: "linear-gradient(to right, transparent, rgba(201,151,42,0.6))" }} />
            <div className="w-2 h-2 rounded-full" style={{ background: "#c9972a" }} />
            <div className="h-px w-16" style={{ background: "linear-gradient(to left, transparent, rgba(201,151,42,0.6))" }} />
          </div>

          {/* Tagline */}
          <p className="fade-up-delay-3 font-dm text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#4a6480" }}>
            Document Management & Compliance Tracking System for Maritime Operations
          </p>

          {/* Stats row */}
          <div className="fade-up-delay-4 mt-10 grid grid-cols-3 gap-4">
            {[
              { value: "4", label: "Doc Types" },
              { value: "90d", label: "Alert Window" },
              { value: "24/7", label: "Monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl px-3 py-3 bg-white/60"
                style={{ border: "1px solid rgba(201,151,42,0.25)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div className="font-cinzel font-bold text-xl" style={{ color: "#c9972a" }}>{stat.value}</div>
                <div className="text-[10px] font-dm uppercase tracking-widest mt-0.5" style={{ color: "#6a85a0" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">

        {/* White/light background for form side */}
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,151,42,0.08) 0%, transparent 60%)" }} />

        {/* Left border separator */}
        <div className="absolute left-0 top-16 bottom-16 w-px hidden lg:block"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(201,151,42,0.3), transparent)" }} />

        <div className="relative z-10 w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <img src="/poseidon-logo.png" alt="Poseidon" className="w-14 h-14 object-contain" />
            <div>
              <div className="font-cinzel font-bold text-lg tracking-wide" style={{ color: "#8a6010" }}>Poseidon IMS</div>
              <div className="text-[10px] font-dm uppercase tracking-widest" style={{ color: "#6a85a0" }}>Maritime Services</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 fade-up">
            <h3 className="font-cinzel font-bold text-3xl tracking-wide mb-2" style={{ color: "#1a2d45" }}>
              Sign In
            </h3>
            <p className="font-dm text-sm" style={{ color: "#6a85a0" }}>
              Access your maritime document dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="fade-up-delay-1">
              <label className="block text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2"
                style={{ color: "#8a6010" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@poseidon.ph"
                className="w-full rounded-xl px-4 py-3.5 text-sm transition-all font-dm focus:outline-none"
                style={{
                  background: "#f0f5fb",
                  border: "1.5px solid #dce6f0",
                  color: "#1a2d45",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#c9972a"; e.target.style.boxShadow = "0 0 0 3px rgba(201,151,42,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#dce6f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div className="fade-up-delay-2">
              <label className="block text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2"
                style={{ color: "#8a6010" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3.5 text-sm transition-all font-dm focus:outline-none"
                style={{
                  background: "#f0f5fb",
                  border: "1.5px solid #dce6f0",
                  color: "#1a2d45",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#c9972a"; e.target.style.boxShadow = "0 0 0 3px rgba(201,151,42,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#dce6f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Submit */}
            <div className="fade-up-delay-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl font-cinzel font-bold text-sm tracking-[0.12em] uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #b8841f, #e8b84b, #c9972a)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(201,151,42,0.35)",
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(201,151,42,0.5)"; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(201,151,42,0.35)"; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : "Access Dashboard"}
              </button>
            </div>
          </form>

          {/* Demo accounts */}
          <div className="fade-up-delay-4 mt-8 pt-6" style={{ borderTop: "1px solid #e8eef5" }}>
            <p className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-center mb-3" style={{ color: "#a0b0c0" }}>
              Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: "Admin", email: "admin@maritime.ph", pass: "admin123" },
                { role: "Manager", email: "manager@maritime.ph", pass: "staff123" },
                { role: "Staff", email: "staff@maritime.ph", pass: "staff123" },
              ].map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                  className="text-[11px] py-2 px-3 rounded-lg font-cinzel tracking-wide transition-all"
                  style={{ border: "1px solid #dce6f0", color: "#6a85a0", background: "#f8fafc" }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "#c9972a"; (e.target as HTMLButtonElement).style.color = "#8a6010"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "#dce6f0"; (e.target as HTMLButtonElement).style.color = "#6a85a0"; }}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] mt-8 font-dm" style={{ color: "#b0c0d0" }}>
            © {new Date().getFullYear()} Poseidon International Maritime Services, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
