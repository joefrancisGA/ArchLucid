import { cn } from "@/lib/utils";

import { SPONSOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type SponsorPageHeaderProps = {
  readonly eyebrow?: string;
  readonly title: string;
  readonly lead?: string | null;
  readonly className?: string;
};

/** Canonical sponsor page title stack — eyebrow, h1, optional lead (TB-119 typography). */
export function SponsorPageHeader(props: SponsorPageHeaderProps) {
  const { eyebrow = "Sponsor view", title, lead = null, className } = props;
  const trimmedLead = lead?.trim() ?? "";

  return (
    <header className={cn("space-y-2", className)}>
      <p className={cn("m-0", SPONSOR_TYPOGRAPHY.eyebrow)}>{eyebrow}</p>
      <h1 className={cn("m-0", SPONSOR_TYPOGRAPHY.pageTitle)}>{title}</h1>
      {trimmedLead.length > 0 ? (
        <p className={cn("m-0 max-w-2xl", SPONSOR_TYPOGRAPHY.lead)}>{trimmedLead}</p>
      ) : null}
    </header>
  );
}
