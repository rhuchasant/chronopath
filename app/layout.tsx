import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChronoPath — A digital ancestor for historic walks",
  description:
    "An AI system that adapts historical narratives to who's listening, grounded in primary sources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
