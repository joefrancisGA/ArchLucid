"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINDING_DERIVATION_ASSEMBLED_PREFIX,
  type FindingDerivationResult,
} from "@/lib/findings/finding-derivation-sentence";
import {
  FINDING_DERIVATION_EVIDENCE_OPEN_PARAM,
  findingDerivationEvidenceDisclosureHrefFromSearch,
  parseFindingDerivationEvidenceOpenFromSearch,
} from "@/lib/findings/finding-derivation-evidence-disclosure-url";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { cn } from "@/lib/utils";

export type FindingDerivationLineProps = {
  readonly derivation: FindingDerivationResult;
  readonly evidenceHref?: string | null;
  readonly evidenceRefCount?: number | null;
  readonly testId?: string;
  readonly compact?: boolean;
};

/** One-sentence finding derivation with optional evidence-trail expand (TB-2154). */
export function FindingDerivationLine(props: FindingDerivationLineProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const [findingDerivationEvidenceOpen, setFindingDerivationEvidenceOpenState] = useState(() =>
    parseFindingDerivationEvidenceOpenFromSearch(null),
  );
  const findingDerivationEvidenceOpenRef = useRef(findingDerivationEvidenceOpen);
  findingDerivationEvidenceOpenRef.current = findingDerivationEvidenceOpen;

  const syncFindingDerivationEvidenceOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingDerivationEvidenceDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setFindingDerivationEvidenceOpen = useCallback(
    (open: boolean) => {
      if (findingDerivationEvidenceOpenRef.current === open) {
        return;
      }

      findingDerivationEvidenceOpenRef.current = open;
      setFindingDerivationEvidenceOpenState(open);
      syncFindingDerivationEvidenceOpenToUrl(open);
    },
    [syncFindingDerivationEvidenceOpenToUrl],
  );

  const {
    derivation,
    evidenceHref,
    evidenceRefCount,
    testId = "finding-derivation-line",
    compact = false,
  } = props;
  const evidenceLink =
    evidenceHref !== null && evidenceHref !== undefined && evidenceHref.trim().length > 0 ? evidenceHref : null;
  const evidenceRefCountStored =
    typeof evidenceRefCount === "number" && Number.isFinite(evidenceRefCount);
  const citedEvidenceCount = evidenceRefCountStored ? Math.max(0, Math.trunc(evidenceRefCount)) : 0;
  const evidenceActionLabel =
    evidenceRefCount === null || evidenceRefCount === undefined
      ? "Evidence reference count was not stored"
      : citedEvidenceCount > 0
        ? "Show evidence"
        : "Open finding";
  const sentenceAlreadyPrefixed =
    derivation.sentence.startsWith(FINDING_DERIVATION_ASSEMBLED_PREFIX)
    || derivation.sentence.startsWith("Assembled from stored rule fields, not a stored explanation.");
  const sentence =
    derivation.synthesised && !sentenceAlreadyPrefixed
      ? `${FINDING_DERIVATION_ASSEMBLED_PREFIX} ${derivation.sentence}`
      : derivation.sentence;

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseFindingDerivationEvidenceOpenFromSearch(
        new URLSearchParams(window.location.search).get(FINDING_DERIVATION_EVIDENCE_OPEN_PARAM),
      );

      if (findingDerivationEvidenceOpenRef.current === next) {
        return;
      }

      findingDerivationEvidenceOpenRef.current = next;
      setFindingDerivationEvidenceOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  if (compact) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={testId}>
        <span data-testid={`${testId}-sentence`}>{sentence}</span>
        {evidenceLink !== null ? (
          <>
            {" "}
            <Link
              href={evidenceLink}
              prefetch={false}
              className={cn("font-medium", OPERATOR_LINK.inline)}
              data-testid={`${testId}-evidence-link`}
            >
              {evidenceActionLabel}
            </Link>
          </>
        ) : (
          <>
            {" "}
            <span data-testid={`${testId}-evidence-missing`}>Evidence trail link was not stored.</span>
          </>
        )}
      </p>
    );
  }

  return (
    <div className="space-y-1" data-testid={testId}>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid={`${testId}-sentence`}>
        {sentence}
      </p>
      {evidenceLink !== null ? (
        <details
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          open={findingDerivationEvidenceOpen}
          onToggle={(event) => {
            event.preventDefault();
            setFindingDerivationEvidenceOpen(!findingDerivationEvidenceOpenRef.current);
          }}
        >
          <summary className="cursor-pointer select-none font-medium text-al-text-primary">{evidenceActionLabel}</summary>
          <p className="m-0 mt-1">
            <Link
              href={evidenceLink}
              prefetch={false}
              className={cn("font-medium", OPERATOR_LINK.inline)}
              data-testid={`${testId}-evidence-link`}
            >
              {citedEvidenceCount > 0 ? "Open evidence trail" : evidenceActionLabel}
            </Link>
          </p>
        </details>
      ) : (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span data-testid={`${testId}-evidence-missing`}>Evidence trail link was not stored.</span>
        </p>
      )}
    </div>
  );
}
