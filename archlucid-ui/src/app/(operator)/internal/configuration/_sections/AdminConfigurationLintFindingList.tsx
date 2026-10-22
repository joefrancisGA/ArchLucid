import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { normalizePath } from "./admin-configuration-helpers";
import type { AdminConfigLintFinding } from "./admin-configuration-types";

type Props = {
  readonly rows: AdminConfigLintFinding[] | null | undefined;
};

export function AdminConfigurationLintFindingList(props: Props) {
  const items = props.rows ?? [];

  if (items.length === 0) {
    return <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>None.</p>;
  }

  return (
    <ul className={cn("m-0 mt-1 list-disc space-y-1 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
      {items.map((f, i) => {
        const rule = normalizePath(f.ruleName).length > 0 ? normalizePath(f.ruleName) : " — ";
        const msg = normalizePath(f.message).length > 0 ? normalizePath(f.message) : " — ";

        return (
          <li key={`${rule}-${i}`}>
            <span className={cn("font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{rule}</span>
            <span className="mx-1 text-al-text-secondary">—</span>
            <span>{msg}</span>
          </li>
        );
      })}
    </ul>
  );
}
