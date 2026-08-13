import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CLOUD_CONNECTIONS_EVIDENCE_ONLY_SUMMARY,
  CLOUD_CONNECTIONS_EVIDENCE_ONLY_TITLE,
} from "@/lib/cloud-connections-copy";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Evidence-only path — valid first option without cloud vendor access. */
export function EvidenceOnlyConnectionCard() {
  return (
    <Card data-testid="cloud-connection-card-evidence-only" className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{CLOUD_CONNECTIONS_EVIDENCE_ONLY_TITLE}</CardTitle>
        <CardDescription>{CLOUD_CONNECTIONS_EVIDENCE_ONLY_SUMMARY}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pt-0">
        <dl className={OPERATOR_TYPOGRAPHY.body}>
          <div className="flex justify-between gap-2">
            <dt className="text-al-text-secondary">Status</dt>
            <dd className="font-medium">Always available</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-al-text-secondary">Authentication model</dt>
            <dd className="font-medium">Uploaded evidence</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-al-text-secondary">Last validation</dt>
            <dd className="font-medium">Not applicable</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-al-text-secondary">Evidence collected</dt>
            <dd className="font-medium">Briefs, diagrams, documents, ZIP exports</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="mt-auto border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <Button type="button" variant="primary" className={CTA_WIDTH.content} asChild>
          <Link href="/architecture/reviews/new">Start architecture review</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
