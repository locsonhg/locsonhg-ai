import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "locsonhg-ai Preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Decorative Circles */}
        <div
          style={{
            position: "absolute",
            width: "800px",
            height: "800px",
            background: "#3b82f6",
            opacity: 0.15,
            filter: "blur(80px)",
            borderRadius: "50%",
            top: "-200px",
            left: "-200px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            background: "#a855f7",
            opacity: 0.15,
            filter: "blur(80px)",
            borderRadius: "50%",
            bottom: "-100px",
            right: "-100px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.05em",
            marginBottom: "20px",
            zIndex: 10,
          }}
        >
          locsonhg-ai
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 42,
            fontWeight: 500,
            color: "#94a3b8",
            letterSpacing: "-0.01em",
            textAlign: "center",
            maxWidth: "800px",
            zIndex: 10,
          }}
        >
          Trợ lý AI siêu tốc • Giao diện mượt mà • Dữ liệu cục bộ
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 40,
            fontSize: 28,
            color: "#64748b",
            fontWeight: 400,
          }}
        >
          Powered by Next.js & Cloudflare Workers
        </div>
      </div>
    ),
    { ...size }
  );
}
