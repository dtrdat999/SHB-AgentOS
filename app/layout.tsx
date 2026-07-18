import type { Metadata } from "next";
import { Cabin } from "next/font/google";
import "./globals.css";

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "SHB-AgentOS | AI Banking Platform",
  description: "An AI Workforce Platform for Intelligent Banking Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${cabin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
