"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import {
  manifestDeliverablesArtifactsDisclosureHrefFromSearch,
  parseManifestDeliverablesArtifactsOpenFromSearch,
} from "@/lib/governance/manifest-deliverables-artifacts-disclosure-url";
import type { ArtifactDescriptor } from "@/types/authority";
import { cn } from "@/lib/utils";

type ManifestDeliverablesArtifactsDisclosureProps = {
  readonly manifestId: string;
  readonly artifacts: readonly ArtifactDescriptor[];
  readonly artifactCount: number;
};

/** Sealed-record deliverables artifact table disclosure synced to URL. */
export function ManifestDeliverablesArtifactsDisclosure(
  props: ManifestDeliverablesArtifactsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const manifestDeliverablesArtifactsOpenParam = searchParams.get("manifestDeliverablesArtifactsOpen");
  const [open, setOpenState] = useState(() =>
    parseManifestDeliverablesArtifactsOpenFromSearch(manifestDeliverablesArtifactsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        manifestDeliverablesArtifactsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseManifestDeliverablesArtifactsOpenFromSearch(manifestDeliverablesArtifactsOpenParam));
  }, [manifestDeliverablesArtifactsOpenParam]);

  return (
    <details
      className="group rounded-md border border-neutral-200/90 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-950/30"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary
        className={cn(
          "cursor-pointer select-none text-al-text-primary outline-none marker:text-al-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
          OPERATOR_DISCLOSURE_TRIGGER_CLASS,
        )}
      >
        Show deliverable artifacts ({props.artifactCount})
      </summary>
      <div className="mt-4">
        <ArtifactListTable
          manifestId={props.manifestId}
          artifacts={[...props.artifacts]}
          sponsorMode={true}
          audienceSections={true}
        />
      </div>
    </details>
  );
}
