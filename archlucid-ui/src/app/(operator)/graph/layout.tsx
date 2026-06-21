import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store" as const;

export const metadata: Metadata = {
  title: "Evidence trail",
};

export default function GraphLayout({ children }: { children: ReactNode }) {
  return children;
}
