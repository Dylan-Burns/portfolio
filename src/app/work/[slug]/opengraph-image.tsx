import { ImageResponse } from "next/og";
import { getProject } from "@/content/projects";

export { generateStaticParams } from "./page"; // prerender one OG image per project, matching the page route

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  const name = p?.name ?? "Dylan Burns";
  const kicker = p?.category ?? "Portfolio";
  const tagline = p?.tagline ?? "";
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
          background: "linear-gradient(135deg,#161a38,#07070d)",
          color: "#e7e9f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#7e85bd" }}>{kicker}</div>
        <div style={{ fontSize: 80, fontWeight: 700, marginTop: 14 }}>{name}</div>
        <div style={{ fontSize: 30, color: "#a3a8cd", marginTop: 16, maxWidth: 900 }}>{tagline}</div>
      </div>
    ),
    size,
  );
}
