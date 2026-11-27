import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_ACCELERATOR_STARTER_PACKS, SECURENOW_ACCELERATOR_STARTER_PACKS_HEADING } from "@/lib/product-line/securenow-accelerator-starter-packs";

export function SecureNowAcceleratorStarterPacksSection(): React.JSX.Element {
  return (
    <section aria-labelledby="securenow-accelerator-starter-packs-heading" data-testid="securenow-accelerator-starter-packs">
      <h2 id="securenow-accelerator-starter-packs-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {SECURENOW_ACCELERATOR_STARTER_PACKS_HEADING}
      </h2>
      <ul className="mt-2 space-y-3">
        {SECURENOW_ACCELERATOR_STARTER_PACKS.map((pack) => (
          <li key={pack.persona} className="rounded border border-border p-3">
            <p className={OPERATOR_TYPOGRAPHY.body}>
              <span className="font-medium">{pack.persona}</span>
            </p>
            <ul className="m-0 mt-1 list-disc pl-5">
              {pack.rows.map((row) => (
                <li key={row.href} className={OPERATOR_TYPOGRAPHY.helper}>
                  <Link href={row.href} className={OPERATOR_LINK.inline} data-testid={`securenow-starter-pack-link-${pack.persona}-${row.href}`}>
                    {row.label}
                  </Link>
                  {" — "}
                  {row.summary}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
