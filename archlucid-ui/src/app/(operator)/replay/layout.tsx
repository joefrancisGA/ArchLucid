import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Replay review",
};

export default function ReplayLayout({ children }: { children: ReactNode }) {
  return children;
}
