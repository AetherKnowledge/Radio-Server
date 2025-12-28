import type { Metadata } from "next";
import { PublicEnvScript } from "next-runtime-env";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import PopupProvider from "./components/Popup/PopupProvider";
import "./globals.css";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = (await cookieStore).get("theme")?.value || "light";

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <PublicEnvScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PopupProvider>
          <div className="min-h-screen bg-base-200">{children}</div>
        </PopupProvider>
      </body>
    </html>
  );
}
