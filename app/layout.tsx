import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import { QuickAddProvider } from "@/components/layout/QuickAddProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans bg-background text-text-primary antialiased`}>
        <QuickAddProvider>
          <AppShell>{children}</AppShell>
          <BottomNav />
        </QuickAddProvider>
      </body>
    </html>
  );
}
