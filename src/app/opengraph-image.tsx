import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.role}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg,#1a1c3d,#07070d)",
          color: "#e7e9f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#7e85bd" }}>{site.role}</div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 16 }}>{site.name}</div>
        <div style={{ fontSize: 32, color: "#a3a8cd", marginTop: 16 }}>Software products that people actually use.</div>
      </div>
    ),
    size,
  );
}
