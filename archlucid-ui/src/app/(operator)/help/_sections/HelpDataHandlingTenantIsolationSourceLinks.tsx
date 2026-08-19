import Link from "next/link";

import { DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Artifact index table for data-handling diligence cites (HED). */
export function HelpDataHandlingTenantIsolationSourceLinks(): React.ReactElement {
  return (
    <div className="overflow-x-auto" data-testid="help-data-handling-tenant-isolation-source-links">
      <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="py-2 pr-3 font-semibold text-al-text-primary">Artifact</th>
            <th className="py-2 pr-3 font-semibold text-al-text-primary">What it evidences</th>
            <th className="py-2 font-semibold text-al-text-primary">Access</th>
          </tr>
        </thead>
        <tbody>
          {DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.map((link) => (
            <tr
              key={`${link.href}-${link.label}`}
              className="border-b border-neutral-100 dark:border-neutral-800"
              data-testid={`help-data-handling-tenant-isolation-source-row-${link.label}`}
            >
              <td className="py-2 pr-3 align-top">
                <Link
                  className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </td>
              <td className="py-2 pr-3 align-top text-al-text-secondary">{link.evidences}</td>
              <td className="py-2 align-top text-al-text-secondary">{link.access}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
