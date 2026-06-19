import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isInvalidManifestRouteId } from "@/lib/route-dynamic-param";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export const metadata: Metadata = {
  title: "Manifest",
};

export default async function ManifestLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ manifestId: string }>;
}) {
  const { manifestId } = await params;

  if (isInvalidManifestRouteId(manifestId)) {
    notFound();
  }

  return children;
}
