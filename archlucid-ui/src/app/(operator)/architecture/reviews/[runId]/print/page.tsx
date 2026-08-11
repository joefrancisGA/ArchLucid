import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { PACKAGE_PRINT_PAGE_TITLE } from "@/lib/package-print-view";

import { PackagePrintPageClient } from "./_sections/PackagePrintPageClient";

export const metadata: Metadata = {
  title: PACKAGE_PRINT_PAGE_TITLE,
};

/** Dedicated print stylesheet view for an architecture package (TB-2205). */
export default async function PackagePrintPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}): Promise<React.JSX.Element> {
  const { runId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  return <PackagePrintPageClient runId={runId} />;
}
