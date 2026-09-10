"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import {
  assuranceStatusVocabularyDisclosureHrefFromSearch,
  parseAssuranceStatusVocabularyOpenFromSearch,
} from "@/lib/assurance-status/assurance-status-vocabulary-disclosure-url";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import {
  buildTrustAssuranceSecurityTrustVocabulary,
  resolveTrustAssuranceSecurityTrustPeerLinks,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import { cn } from "@/lib/utils";

/** Demoted triad orientation — Trust Center vs Assurance status vs Security & Trust hub. */
export function AssuranceStatusVocabularyDisclosure(): ReactNode {
  const router = useRouter();
  const pathname = usePathname() ?? "/assurance-status";
  const searchParams = useSearchParams();
  const assuranceStatusVocabularyOpenParam = searchParams.get("assuranceStatusVocabularyOpen");
  const [vocabularyOpen, setVocabularyOpenState] = useState(() =>
    parseAssuranceStatusVocabularyOpenFromSearch(assuranceStatusVocabularyOpenParam),
  );
  const model = buildTrustAssuranceSecurityTrustVocabulary();
  const peers = resolveTrustAssuranceSecurityTrustPeerLinks("assurance-status");

  const syncVocabularyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(assuranceStatusVocabularyDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setVocabularyOpen = useCallback(
    (open: boolean) => {
      setVocabularyOpenState(open);
      syncVocabularyOpenToUrl(open);
    },
    [syncVocabularyOpenToUrl],
  );

  useEffect(() => {
    setVocabularyOpenState(parseAssuranceStatusVocabularyOpenFromSearch(assuranceStatusVocabularyOpenParam));
  }, [assuranceStatusVocabularyOpenParam]);

  return (
    <details
      className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
      data-testid="assurance-status-vocabulary-disclosure"
      open={vocabularyOpen}
      onToggle={(event) => {
        setVocabularyOpen(event.currentTarget.open);
      }}
    >
      <summary className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularySummary}>Related trust surfaces</summary>
      <div className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyBody}>
        <p className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyIntro}>{model.whyThree}</p>
        <ul className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyPeerList}>
          {peers.map((peer) => (
            <li key={peer.id} data-testid={`assurance-status-vocabulary-peer-${peer.id}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={peer.href}>
                {peer.label}
              </Link>
              <p className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyPeerWhen}>{peer.whenToUse}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
