import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import { QuickAddProvider } from "@/components/layout/QuickAddProvider";
import { DataRefreshProvider } from "@/components/layout/DataRefreshProvider";
import PwaProvider from "@/components/pwa/PwaProvider";
import SplashLinks from "@/components/pwa/SplashLinks";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker — catat pengeluaran & pemasukan dengan cepat",
  applicationName: "Finance Tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finance",
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0055A4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <SplashLinks />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-text-primary antialiased`}>
        <Suspense fallback={null}>
          <DataRefreshProvider>
            <QuickAddProvider>
              <AppShell>{children}</AppShell>
              <BottomNav />
              <PwaProvider />
            </QuickAddProvider>
          </DataRefreshProvider>
        </Suspense>
      </body>
    </html>
  );
}
