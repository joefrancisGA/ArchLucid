import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { diffPolicyPackContent, type PolicyPackDiffItem } from "@/lib/policy/policy-pack-diff";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import type { PolicyPackVersion } from "@/types/policy-packs";

const cardBaseCls = (cn("mb-2.5 rounded-lg border p-3", OPERATOR_TYPOGRAPHY.body));

function cardCls(changeType: "added" | "removed" | "changed"): string {
  if (changeType === "added")
    return `${cardBaseCls} border-emerald-700/40 bg-al-surface-raised text-al-text-primary dark:border-emerald-800/50`;

  if (changeType === "removed")
    return `${cardBaseCls} border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50`;

  return `${cardBaseCls} border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50`;
}

function changeLabel(changeType: "added" | "removed" | "changed"): string {
  if (changeType === "added") {
    return "Added";
  }

  if (changeType === "removed") {
    return "Removed";
  }

  return "Changed";
}

export type PolicyPackDiffViewProps = {
  leftVersion: PolicyPackVersion;
  rightVersion: PolicyPackVersion;
};

/**
 * Side-by-side policy pack version diff: structural JSON deltas as colored cards (compare page pattern).
 */
export function PolicyPackDiffView(props: PolicyPackDiffViewProps) {
  const { leftVersion, rightVersion } = props;
  let items: PolicyPackDiffItem[] = [];
  let parseError: string | null = null;

  try {
    items = diffPolicyPackContent(
      leftVersion.contentJson ?? "",
      rightVersion.contentJson ?? "",
    );
  } catch {
    parseError = "Could not parse one or both version content JSON payloads.";
  }

  return (
    <section aria-label="Policy pack version diff" className="mt-5">
      <h4 className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.body)}>Content diff</h4>
      <div className={cn("mb-4 flex flex-wrap items-baseline gap-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span>
          <strong>Left:</strong> <code className={OPERATOR_TYPOGRAPHY.helper}>{leftVersion.version}</code>
          <span className="ml-2 text-neutral-500 dark:text-neutral-400">
            ({formatIsoUtcForDisplay(leftVersion.createdUtc)})
          </span>
        </span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
          →
        </span>
        <span>
          <strong>Right:</strong> <code className={OPERATOR_TYPOGRAPHY.helper}>{rightVersion.version}</code>
          <span className="ml-2 text-neutral-500 dark:text-neutral-400">
            ({formatIsoUtcForDisplay(rightVersion.createdUtc)})
          </span>
        </span>
      </div>

      {parseError !== null ? (
        <p role="alert" className={cn("text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
          {parseError}
        </p>
      ) : null}

      {parseError === null && items.length === 0 ? (
        <OperatorEmptyState title="No content differences">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Parsed JSON is structurally identical for these two versions.</p>
        </OperatorEmptyState>
      ) : null}

      {parseError === null && items.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {items.map((item) => (
            <li
              key={`${item.changeType}-${item.path}`}
              data-change-type={item.changeType}
              data-card-tone={item.changeType}
              data-diff-path={item.path}
              className={cardCls(item.changeType)}
            >
              <div className="mb-1.5 font-semibold">
                <span data-diff-label>{changeLabel(item.changeType)}</span>
                {" · "}
                <code className={OPERATOR_TYPOGRAPHY.helper}>{item.path}</code>
              </div>
              {item.changeType === "added" && item.rightValue !== undefined ? (
                <pre
                  data-diff-value="right"
                  className={cn("m-0 whitespace-pre-wrap break-words font-mono", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {item.rightValue}
                </pre>
              ) : null}
              {item.changeType === "removed" && item.leftValue !== undefined ? (
                <pre
                  data-diff-value="left"
                  className={cn("m-0 whitespace-pre-wrap break-words font-mono", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {item.leftValue}
                </pre>
              ) : null}
              {item.changeType === "changed" ? (
                <div className="grid gap-2">
                  <div>
                    <div className={cn("mb-1 font-semibold", OPERATOR_TYPOGRAPHY.helper)}>Before</div>
                    <pre
                      data-diff-value="left"
                      className={cn("m-0 whitespace-pre-wrap break-words font-mono", OPERATOR_TYPOGRAPHY.helper)}
                    >
                      {item.leftValue ?? "—"}
                    </pre>
                  </div>
                  <div>
                    <div className={cn("mb-1 font-semibold", OPERATOR_TYPOGRAPHY.helper)}>After</div>
                    <pre
                      data-diff-value="right"
                      className={cn("m-0 whitespace-pre-wrap break-words font-mono", OPERATOR_TYPOGRAPHY.helper)}
                    >
                      {item.rightValue ?? "—"}
                    </pre>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
