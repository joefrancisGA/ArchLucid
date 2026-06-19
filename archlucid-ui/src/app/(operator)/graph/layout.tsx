import type { Metadata } from "next";
import type { ReactNode } from "react";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export const metadata: Metadata = {
  title: "Evidence trail",
};

export default function GraphLayout({ children }: { children: ReactNode }) {
  return children;
}
