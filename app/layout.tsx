import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "locsonhg-ai | Trợ lý ảo thông minh",
  description:
    "Trải nghiệm locsonhg-ai - Trợ lý AI cá nhân thông minh, nhanh chóng và mượt mà.",
  keywords: [
    "locsonhg-ai",
    "chatbot",
    "AI",
    "trợ lý ảo",
    "tạo đoạn chat",
    "Next.js",
  ],
  authors: [{ name: "locsonhg" }],
  openGraph: {
    title: "locsonhg-ai | Trợ lý ảo thông minh",
    description:
      "Trải nghiệm locsonhg-ai - Trợ lý AI cá nhân thông minh, siêu nhạy, giao diện cực mượt.",
    url: "/",
    siteName: "locsonhg-ai",
    images: [
      {
        url: "/opengraph-image", // Sửa trỏ trực tiếp đến route phát sinh ảnh
        width: 1200,
        height: 630,
        alt: "locsonhg-ai Preview",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "locsonhg-ai | Trợ lý ảo thông minh",
    description:
      "Trải nghiệm locsonhg-ai - Trợ lý AI cá nhân thông minh, siêu nhạy, giao diện cực mượt.",
    images: ["/opengraph-image"], // Tương tự ở đây
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
