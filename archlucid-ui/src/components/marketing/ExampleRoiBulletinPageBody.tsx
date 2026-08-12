import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { ExampleRoiBulletinEvidenceOrientationStrip } from "@/components/marketing/ExampleRoiBulletinEvidenceOrientationStrip";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF } from "@/lib/marketing/example-roi-bulletin-honesty";

export const EXAMPLE_ROI_BULLETIN_PAGE_TITLE = "Example aggregate ROI bulletin (synthetic)";

const inlineCodeClassName =
  "rounded bg-neutral-100 px-1 font-mono text-sm text-al-text-primary dark:bg-neutral-900";

export type ExampleRoiBulletinPageBodyProps = {
  readonly markdown: string;
  readonly illustrativeQuarter: string;
  readonly operatorAdminPreviewHref: string;
};

/** Public synthetic ROI bulletin sample — marketing shell body (TB-1516). */
export function ExampleRoiBulletinPageBody(props: ExampleRoiBulletinPageBodyProps): ReactNode {
  const { markdown, illustrativeQuarter, operatorAdminPreviewHref } = props;

  return (
    <div className={cn(MARKETING_LAYOUT.sectionStack, "space-y-8")} data-testid="example-roi-bulletin-body">
      <header className="space-y-3">
        <h1 className={cn("m-0", MARKETING_TYPOGRAPHY.pageTitle)}>{EXAMPLE_ROI_BULLETIN_PAGE_TITLE}</h1>
        <p className={cn("m-0 max-w-prose", MARKETING_TYPOGRAPHY.lead)}>
          This page shows the <strong>Markdown shape</strong> of a quarterly aggregate baseline bulletin before{" "}
          <strong>N ≥ 5</strong> qualifying tenants exist. It is <strong>not</strong> a signed publication and must{" "}
          <strong>never</strong> receive a{" "}
          <code className={inlineCodeClassName}>## … ROI bulletin signed:</code> entry in the product changelog.
        </p>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Illustrative quarter label in the sample: <strong>{illustrativeQuarter}</strong> (static example — not the
          current publication period).
        </p>
      </header>

      <ExampleRoiBulletinEvidenceOrientationStrip />

      <section
        aria-label="Admin-only real publication gate"
        className={cn(
          MARKETING_SURFACES.sectionPanel,
          "border-amber-600/40 bg-al-surface-raised dark:border-amber-700/50",
        )}
        data-testid="example-roi-bulletin-admin-gate"
      >
        <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Admin-only: real aggregate preview (Admin API)
        </p>
        <p className={cn("m-0 mt-2 max-w-prose", MARKETING_TYPOGRAPHY.body)}>
          Authentic aggregate numbers require an API key with <strong>Admin access</strong> after sign-in. The same
          contract the ArchLucid CLI uses is exposed as a same-origin link (returns <strong>401/403</strong> without
          credentials — expected on this public page):
        </p>
        <p className="m-0 mt-3">
          <Link className={MARKETING_SURFACES.inlineLink} href={operatorAdminPreviewHref}>
            Open admin-only preview (sign-in required)
          </Link>
        </p>
      </section>

      <section aria-labelledby="synthetic-md-heading" className={MARKETING_SURFACES.sectionPanel}>
        <h2 id="synthetic-md-heading" className={cn("m-0", MARKETING_TYPOGRAPHY.sectionTitle)}>
          Checked-in sample Markdown
        </h2>
        <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Checked-in sample Markdown (rendered below for convenience).
        </p>
        <pre
          className={cn(
            "mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950",
          )}
        >
          {markdown}
        </pre>
      </section>

      <section className={cn(MARKETING_SURFACES.mutedPanel, "text-al-text-secondary")}>
        <p className={cn("m-0 max-w-prose", MARKETING_TYPOGRAPHY.body)}>
          For methodology and sponsor-safe interpretation, see{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href={EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF}>
            Pilot ROI model (help)
          </Link>
          . Signed-in admins can generate a synthetic CLI draft with{" "}
          <code className={inlineCodeClassName}>
            archlucid roi-bulletin --quarter {illustrativeQuarter} --synthetic
          </code>
          .
        </p>
      </section>
    </div>
  );
}
