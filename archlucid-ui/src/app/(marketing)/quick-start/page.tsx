import { permanentRedirect } from "next/navigation";

import { buildQuickStartRedirectPath } from "@/lib/legacy-quick-start-redirect";

type QuickStartRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** @deprecated The canonical public first-run surface is `/get-started`. */
export default async function QuickStartRedirectPage({ searchParams }: QuickStartRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildQuickStartRedirectPath(resolved));
}
