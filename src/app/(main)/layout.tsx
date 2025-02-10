import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { ServerDataUpdaterService } from "@/components/ServerDataUpdaterService";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "SysRegister",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <body
        className={`${inter.className} overflow-x-hidden antialiased dark bg-background text-text`}
      >
        <Suspense>
          <ServerDataUpdaterService />
          <div className="p-6 relative">
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-20 -z-10" />
            <p className="text-3xl font-bold">SysRegister</p>
            <p className="text-accent text-sm">v2025.01.30</p>
          </div>
          {children}
          <div className="pt-[85px]" />
          <Navbar />
        </Suspense>
      </body>
    </html>
  );
}
