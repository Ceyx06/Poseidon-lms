// src/app/layout.tsx
import type { Metadata } from "next";
import { Cinzel, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Poseidon IMS — Document Management System",
  description: "Poseidon International Maritime Services — Document Tracking System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${dmSans.variable}`}>
      <body className="bg-[#061428] text-slate-100 font-dm antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0d1f3c",
              color: "#e8edf5",
              border: "1px solid rgba(201,151,42,0.2)",
              borderRadius: "10px",
              fontFamily: "var(--font-dm)",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#c9972a", secondary: "#0d1f3c" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#0d1f3c" } },
          }}
        />
      </body>
    </html>
  );
}
