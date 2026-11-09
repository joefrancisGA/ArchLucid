import {
  SECURENOW_PUBLIC_QUOTE_SEQUENCE_HEADING,
  SECURENOW_PUBLIC_QUOTE_SEQUENCE_LEAD,
  SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID,
  SECURENOW_PUBLIC_QUOTE_SEQUENCE_STEPS,
} from "@/lib/marketing/securenow-public-commercial-packaging-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

export function SecureNowPublicQuoteSequenceSection(): React.JSX.Element {
  return (
    <section
      id={SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID}
      aria-labelledby="securenow-public-quote-sequence-heading"
      className="space-y-3 scroll-mt-24"
      data-testid="securenow-public-quote-sequence-section"
    >
      <h2 id="securenow-public-quote-sequence-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        {SECURENOW_PUBLIC_QUOTE_SEQUENCE_HEADING}
      </h2>
      <p className={MARKETING_TYPOGRAPHY.body}>{SECURENOW_PUBLIC_QUOTE_SEQUENCE_LEAD}</p>
      <ol className="m-0 list-decimal space-y-2 pl-5">
        {SECURENOW_PUBLIC_QUOTE_SEQUENCE_STEPS.map((step) => (
          <li key={step} className={MARKETING_TYPOGRAPHY.body}>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
