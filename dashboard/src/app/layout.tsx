import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackendSafe — Backup Dashboard",
  description: "MongoDB backup monitoring and control panel for BackendSafe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-jakarta" style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
