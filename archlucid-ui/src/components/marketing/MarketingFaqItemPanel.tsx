import Link from "next/link";
import { useEffect, useState } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { MarketingFaqItem } from "@/lib/marketing-faq";
import { cn } from "@/lib/utils";

export type MarketingFaqItemPanelProps = {
  readonly item: MarketingFaqItem;
  readonly forceOpen?: boolean;
  readonly defaultOpen?: boolean;
};

export function MarketingFaqItemPanel(props: MarketingFaqItemPanelProps): React.JSX.Element {
  const { item, forceOpen = false, defaultOpen = false } = props;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  return (
    <details
      id={item.id}
      open={forceOpen || open}
      onToggle={(event) => {
        if (forceOpen) {
          return;
        }

        setOpen(event.currentTarget.open);
      }}
      className="group scroll-mt-24 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm open:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={`marketing-faq-item-${item.id}`}
    >
      <summary
        className={cn(
          "cursor-pointer list-none font-medium text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
          MARKETING_TYPOGRAPHY.cardTitle,
        )}
      >
        {item.question}
      </summary>
      <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{item.answer}</p>
      {item.relatedLinks && item.relatedLinks.length > 0 ? (
        <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          <span className="font-medium text-al-text-primary">Related: </span>
          {item.relatedLinks.map((link, index) => (
            <span key={`${link.href}-${link.label}`}>
              {index > 0 ? (
                <span aria-hidden="true"> · </span>
              ) : null}
              <Link className={MARKETING_SURFACES.inlineLink} href={link.href}>
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </details>
  );
}
