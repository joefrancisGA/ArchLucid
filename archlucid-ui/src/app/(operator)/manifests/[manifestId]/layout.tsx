import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isInvalidManifestRouteId } from "@/lib/route-dynamic-param";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Signed review record",
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
