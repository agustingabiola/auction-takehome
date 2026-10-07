import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// A rising bid: the same mark as icon.svg, rendered once at build time
// because iOS wants an opaque PNG.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#7a5af8",
      }}
    >
      <svg width="180" height="180" viewBox="0 0 64 64">
        <path
          d="M17 36 L32 21 L47 36"
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M23 46 H41" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>,
    size,
  );
}
