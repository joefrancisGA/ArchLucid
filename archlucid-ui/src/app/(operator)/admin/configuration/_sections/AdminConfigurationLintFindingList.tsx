import { normalizePath } from "./admin-configuration-helpers";
import type { AdminConfigLintFinding } from "./admin-configuration-types";

type Props = {
  readonly rows: AdminConfigLintFinding[] | null | undefined;
};

export function AdminConfigurationLintFindingList(props: Props) {
  const items = props.rows ?? [];

  if (items.length === 0) {
    return <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">None.</p>;
  }

  return (
    <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
      {items.map((f, i) => {
        const rule = normalizePath(f.ruleName).length > 0 ? normalizePath(f.ruleName) : "—";
        const msg = normalizePath(f.message).length > 0 ? normalizePath(f.message) : "—";

        return (
          <li key={`${rule}-${i}`}>
            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{rule}</span>
            <span className="mx-1 text-neutral-400">—</span>
            <span>{msg}</span>
          </li>
        );
      })}
    </ul>
  );
}
