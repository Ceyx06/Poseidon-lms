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
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    toast.success("Welcome to Poseidon IMS!");

    if (role === "COORDINATOR") {
      router.push("/coordinator/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: "#f0f4f8" }}>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center px-16 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #e8f0fb 0%, #dce8f5 50%, #cddcee 100%)" }} />
        <div className="absolute top-8 left-8 w-20 h-20 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: "rgba(201,151,42,0.4)" }} />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: "rgba(201,151,42,0.4)" }} />

        <div className="relative z-10 text-center">
          <div className="relative mx-auto mb-8 w-52 h-52">
            <div className="absolute inset-0 rounded-full bg-white/70" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }} />
            <img src="/poseidon-logo.png" alt="Poseidon" className="relative z-10 w-full h-full object-contain p-3" />
          </div>
          <h1 className="font-cinzel font-black text-4xl tracking-[0.12em] uppercase" style={{ color: "#8a6010" }}>Poseidon</h1>
          <h2 className="font-cinzel font-semibold text-sm tracking-[0.22em] uppercase mt-1" style={{ color: "#3a5a7a" }}>International Maritime Services, Inc.</h2>
          <div className="my-7 flex items-center gap-4 justify-center">
            <div className="h-px w-16" style={{ background: "linear-gradient(to right, transparent, rgba(201,151,42,0.6))" }} />
            <div className="w-2 h-2 rounded-full" style={{ background: "#c9972a" }} />
            <div className="h-px w-16" style={{ background: "linear-gradient(to left, transparent, rgba(201,151,42,0.6))" }} />
          </div>
          <p className="font-dm text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#4a6480" }}>
            Document Management & Compliance Tracking System
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[{ value: "2", label: "Portals" }, { value: "8", label: "Modules" }, { value: "24/7", label: "Monitoring" }].map((s) => (
              <div key={s.label} className="rounded-xl px-3 py-3 bg-white/60" style={{ border: "1px solid rgba(201,151,42,0.25)" }}>
                <div className="font-cinzel font-bold text-xl" style={{ color: "#c9972a" }}>{s.value}</div>
                <div className="text-[10px] font-dm uppercase tracking-widest mt-0.5" style={{ color: "#6a85a0" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute left-0 top-16 bottom-16 w-px hidden lg:block" style={{ background: "linear-gradient(to bottom, transparent, rgba(201,151,42,0.3), transparent)" }} />

        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-8">
            <h3 className="font-cinzel font-bold text-3xl tracking-wide mb-2" style={{ color: "#1a2d45" }}>Sign In</h3>
            <p className="font-dm text-sm" style={{ color: "#6a85a0" }}>Access your maritime document dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#8a6010" }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@poseidon.ph"
                className="w-full rounded-xl px-4 py-3.5 text-sm font-dm focus:outline-none"
                style={{ background: "#f0f5fb", border: "1.5px solid #dce6f0", color: "#1a2d45" }}
                onFocus={(e) => { e.target.style.borderColor = "#c9972a"; e.target.style.boxShadow = "0 0 0 3px rgba(201,151,42,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#dce6f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#8a6010" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3.5 text-sm font-dm focus:outline-none"
                style={{ background: "#f0f5fb", border: "1.5px solid #dce6f0", color: "#1a2d45" }}
                onFocus={(e) => { e.target.style.borderColor = "#c9972a"; e.target.style.boxShadow = "0 0 0 3px rgba(201,151,42,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#dce6f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-cinzel font-bold text-sm tracking-[0.12em] uppercase disabled:opacity-60 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #b8841f, #e8b84b, #c9972a)", color: "#fff", boxShadow: "0 4px 20px rgba(201,151,42,0.35)" }}>
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e8eef5" }}>
            <p className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-center mb-3" style={{ color: "#a0b0c0" }}>Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "Admin",       email: "admin@maritime.ph",       pass: "admin123" },
                { role: "Coordinator", email: "coordinator@maritime.ph", pass: "coord123" },
              ].map((acc) => (
                <button key={acc.role} type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                  className="text-[11px] py-2 px-3 rounded-lg font-cinzel tracking-wide"
                  style={{ border: "1px solid #dce6f0", color: "#6a85a0", background: "#f8fafc" }}>
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] mt-8 font-dm" style={{ color: "#b0c0d0" }}>
            © {new Date().getFullYear()} Poseidon International Maritime Services, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
