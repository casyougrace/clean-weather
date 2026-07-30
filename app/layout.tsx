import type { Metadata, Viewport } from "next";
import "./globals.css";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isProjectPage = process.env.GITHUB_ACTIONS === "true" && repositoryName && !repositoryName.endsWith(".github.io");
const basePath = isProjectPage ? `/${repositoryName}` : "";

export const metadata: Metadata = {
  title: "清朗天气",
  description: "无广告、无资讯流的极简天气网站",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: { icon: `${basePath}/weather.svg`, apple: `${basePath}/weather.svg` }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f8edb"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
