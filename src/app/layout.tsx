import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Druglens",
  description: "Explore FDA adverse event data and drug-food interactions",
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
