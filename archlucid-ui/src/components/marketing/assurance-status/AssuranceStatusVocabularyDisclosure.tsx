import Link from "next/link";
import type { ReactNode } from "react";

import { OPERATOR_LINK } from "@/lib/design-tokens";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import {
  buildTrustAssuranceSecurityTrustVocabulary,
  resolveTrustAssuranceSecurityTrustPeerLinks,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import { cn } from "@/lib/utils";

/** Demoted triad orientation — Trust Center vs Assurance status vs Security & Trust hub. */
export function AssuranceStatusVocabularyDisclosure(): ReactNode {
  const model = buildTrustAssuranceSecurityTrustVocabulary();
  const peers = resolveTrustAssuranceSecurityTrustPeerLinks("assurance-status");

  return (
    <details
      className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
      data-testid="assurance-status-vocabulary-disclosure"
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
