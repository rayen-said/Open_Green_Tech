<<<<<<< HEAD
import type { Metadata } from "next";
import { Manrope, Noto_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";
import { ToastStack } from "@/components/toast-stack";
import { ChatWidget } from "@/components/chat-widget";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crop Advisor SaaS",
  description: "AI-powered agricultural telemetry and recommendations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${arabic.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          {children}
          <ToastStack />
          <ChatWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
=======
import type { Metadata } from "next";
import { Manrope, Noto_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";
import { ToastStack } from "@/components/toast-stack";
import { ChatWidget } from "@/components/chat-widget";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crop Advisor SaaS",
  description: "AI-powered agricultural telemetry and recommendations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${arabic.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          {children}
          <ToastStack />
          <ChatWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
>>>>>>> origin/web
