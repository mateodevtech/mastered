import { ImageResponse } from "next/og";

export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontSize: 100,
          fontWeight: 600,
          fontFamily: "sans-serif",
        }}
      >
        M
      </div>
    ),
    { width: 192, height: 192 },
  );
}
