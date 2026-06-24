import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Validate review package",
};

export default function ReplayLayout({ children }: { children: ReactNode }) {
  return children;
}
