import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrandIntro } from "@/components/animation/BrandIntro";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Haoxuan Zhang（张颢轩） | Blog & Portfolio",
    template: "%s | Haoxuan Zhang",
  },
  description: "一个克制、流畅、以作品和文章为核心的个人博客与作品集。",
  keywords: ["个人博客", "作品集", "前端开发", "交互设计", "动效设计", "Next.js"],
  authors: [{ name: "Haoxuan Zhang" }],
  creator: "Haoxuan Zhang",
  manifest: "/manifest.json",
  openGraph: {
    title: "Haoxuan Zhang（张颢轩） | Blog & Portfolio",
    description: "代码、动画与视觉设计的个人创作档案。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haoxuan Zhang（张颢轩） | Blog & Portfolio",
    description: "代码、动画与视觉设计的个人创作档案。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#050506" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="noise" />
          <BrandIntro />
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
