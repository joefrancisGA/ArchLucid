import Link from "next/link";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

import { MARKETING_TYPOGRAPHY, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PUBLISHED_LIST_PRICE_EVALUATION_CREDIT,
  SECURENOW_PUBLISHED_LIST_PRICE_HEADING,
  SECURENOW_PUBLISHED_LIST_PRICE_LEAD,
  SECURENOW_PUBLISHED_LIST_PRICE_PHILOSOPHY_HREF,
  SECURENOW_PUBLISHED_LIST_PRICE_POSTURE,
  SECURENOW_PUBLISHED_LIST_PRICE_ROWS,
  SECURENOW_PUBLISHED_LIST_PRICE_SECTION_ID,
} from "@/lib/product-line/securenow-published-list-price-copy";
import { cn } from "@/lib/utils";

type SecureNowPublishedListPriceSectionProps = {
  readonly typography?: "marketing" | "operator";
};

function formatPriceForDisplay(price: string): React.ReactNode {
  const boldMatch = /^\*\*(\$[\d,]+)\*\*(.*)$/.exec(price);

  if (boldMatch === null) {
    return price;
  }

  return (
    <>
      <span className="font-semibold">{boldMatch[1]}</span>
      {boldMatch[2]}
    </>
  );
}

export function SecureNowPublishedListPriceSection(
  props: SecureNowPublishedListPriceSectionProps,
): React.JSX.Element {
  const variant = props.typography ?? "marketing";
  const bodyClass = variant === "operator" ? OPERATOR_TYPOGRAPHY.body : MARKETING_TYPOGRAPHY.body;
  const titleClass = variant === "operator" ? OPERATOR_TYPOGRAPHY.cardTitle : MARKETING_TYPOGRAPHY.sectionTitle;
  const helperClass = variant === "operator" ? OPERATOR_TYPOGRAPHY.helper : MARKETING_TYPOGRAPHY.meta;
  const linkClass = variant === "operator" ? OPERATOR_LINK.inline : "text-al-link underline-offset-2 hover:underline";

  return (
    <section
      id={SECURENOW_PUBLISHED_LIST_PRICE_SECTION_ID}
      aria-labelledby={`${SECURENOW_PUBLISHED_LIST_PRICE_SECTION_ID}-heading`}
      className="space-y-3 scroll-mt-24"
      data-testid="securenow-published-list-price"
    >
      <h2 id={`${SECURENOW_PUBLISHED_LIST_PRICE_SECTION_ID}-heading`} className={titleClass}>
        {SECURENOW_PUBLISHED_LIST_PRICE_HEADING}
      </h2>
      <p className={bodyClass}>{SECURENOW_PUBLISHED_LIST_PRICE_LEAD}</p>
      <EnterpriseTable ariaLabel="SecureNow published list prices">
        <caption className="sr-only">SecureNow published list prices</caption>
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>ID</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>What it sells</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Price</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Meter</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {SECURENOW_PUBLISHED_LIST_PRICE_ROWS.map((row) => (
            <EnterpriseTableRow key={row.id}>
              <EnterpriseTableCell className="font-medium">{row.id}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.what}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatPriceForDisplay(row.price)}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.meter}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
      <p className={cn("m-0", helperClass)} data-testid="securenow-published-list-price-credit">
        {SECURENOW_PUBLISHED_LIST_PRICE_EVALUATION_CREDIT.replace(/\*\*/g, "")}
      </p>
      <p className={cn("m-0", helperClass)}>{SECURENOW_PUBLISHED_LIST_PRICE_POSTURE}</p>
      <p className={cn("m-0", bodyClass)}>
        <Link href={SECURENOW_PUBLISHED_LIST_PRICE_PHILOSOPHY_HREF} className={linkClass}>
          Full conditions in the pricing philosophy (section 9)
        </Link>
      </p>
    </section>
  );
}
