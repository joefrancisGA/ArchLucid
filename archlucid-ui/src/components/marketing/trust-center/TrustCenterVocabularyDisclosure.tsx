"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { OPERATOR_LINK } from "@/lib/design-tokens";
import {
  parseTrustCenterVocabularyOpenFromSearch,
  trustCenterVocabularyDisclosureHrefFromSearch,
} from "@/lib/trust-center/trust-center-vocabulary-disclosure-url";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import {
  buildTrustAssuranceSecurityTrustVocabulary,
  resolveTrustAssuranceSecurityTrustPeerLinks,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import { cn } from "@/lib/utils";

/** Demoted triad orientation — Trust Center vs Assurance status vs Security & Trust hub. */
export function TrustCenterVocabularyDisclosure(): ReactNode {
  const router = useRouter();
  const pathname = usePathname() ?? "/trust";
  const searchParams = useSearchParams();
  const trustCenterVocabularyOpenParam = searchParams.get("trustCenterVocabularyOpen");
  const [vocabularyOpen, setVocabularyOpenState] = useState(() =>
    parseTrustCenterVocabularyOpenFromSearch(trustCenterVocabularyOpenParam),
  );
  const model = buildTrustAssuranceSecurityTrustVocabulary();
  const peers = resolveTrustAssuranceSecurityTrustPeerLinks("trust-center");

  const syncVocabularyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(trustCenterVocabularyDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setVocabularyOpenState(parseTrustCenterVocabularyOpenFromSearch(trustCenterVocabularyOpenParam));
  }, [trustCenterVocabularyOpenParam]);

  return (
    <details
      className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
      data-testid="trust-center-vocabulary-disclosure"
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
            <li key={peer.id} data-testid={`trust-center-vocabulary-peer-${peer.id}`}>
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
