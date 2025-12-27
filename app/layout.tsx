import { Radio } from "lucide-react";
import type { Metadata } from "next";
import { PublicEnvScript } from "next-runtime-env";
import { Geist, Geist_Mono } from "next/font/google";
import PopupProvider from "./components/Popup/PopupProvider";
import "./globals.css";
import ThemeController from "./ThemeController";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radio Server",
  description: "Manage your radio stations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PopupProvider>
          <div className="min-h-screen bg-base-200">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
              <div className="flex-1">
                <a className="btn btn-ghost text-xl gap-2">
                  <Radio className="w-6 h-6" />
                  Radio Server
                </a>
              </div>
              <div className="flex-none">
                <ThemeController />
              </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
        </PopupProvider>
      </body>
    </html>
  );
}
