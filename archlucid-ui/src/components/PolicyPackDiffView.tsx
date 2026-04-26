import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { diffPolicyPackContent, type PolicyPackDiffItem } from "@/lib/policy-pack-diff";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import type { PolicyPackVersion } from "@/types/policy-packs";

const cardBaseCls = "mb-2.5 rounded-lg border p-3 text-sm";

function cardCls(changeType: "added" | "removed" | "changed"): string {
  if (changeType === "added")
    return `${cardBaseCls} border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200`;

  if (changeType === "removed")
    return `${cardBaseCls} border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200`;

  return `${cardBaseCls} border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200`;
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
      <h4 className="mb-2 mt-0 text-base">Content diff</h4>
      <div className="mb-4 flex flex-wrap items-baseline gap-3 text-sm text-neutral-700 dark:text-neutral-300">
        <span>
          <strong>Left:</strong> <code className="text-[13px]">{leftVersion.version}</code>
          <span className="ml-2 text-neutral-500 dark:text-neutral-400">
            ({formatIsoUtcForDisplay(leftVersion.createdUtc)})
          </span>
        </span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
          →
        </span>
        <span>
          <strong>Right:</strong> <code className="text-[13px]">{rightVersion.version}</code>
          <span className="ml-2 text-neutral-500 dark:text-neutral-400">
            ({formatIsoUtcForDisplay(rightVersion.createdUtc)})
          </span>
        </span>
      </div>

      {parseError !== null ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {parseError}
        </p>
      ) : null}

      {parseError === null && items.length === 0 ? (
        <OperatorEmptyState title="No content differences">
          <p className="m-0 text-sm">Parsed JSON is structurally identical for these two versions.</p>
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
                <code className="text-xs">{item.path}</code>
              </div>
              {item.changeType === "added" && item.rightValue !== undefined ? (
                <pre
                  data-diff-value="right"
                  className="m-0 whitespace-pre-wrap break-words font-mono text-xs"
                >
                  {item.rightValue}
                </pre>
              ) : null}
              {item.changeType === "removed" && item.leftValue !== undefined ? (
                <pre
                  data-diff-value="left"
                  className="m-0 whitespace-pre-wrap break-words font-mono text-xs"
                >
                  {item.leftValue}
                </pre>
              ) : null}
              {item.changeType === "changed" ? (
                <div className="grid gap-2">
                  <div>
                    <div className="mb-1 text-xs font-semibold">Before</div>
                    <pre
                      data-diff-value="left"
                      className="m-0 whitespace-pre-wrap break-words font-mono text-xs"
                    >
                      {item.leftValue ?? "—"}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold">After</div>
                    <pre
                      data-diff-value="right"
                      className="m-0 whitespace-pre-wrap break-words font-mono text-xs"
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
