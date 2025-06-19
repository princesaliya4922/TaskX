import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import AppLayout from "@/components/layout/app-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SprintX - Task Management Platform",
  description: "A comprehensive task management platform similar to Jira, built with Next.js, TypeScript, and Prisma.",
  keywords: ["task management", "project management", "agile", "scrum", "kanban"],
  authors: [{ name: "SprintX Team" }],
  creator: "SprintX",
  publisher: "SprintX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
