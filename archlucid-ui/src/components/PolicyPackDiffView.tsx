import type { CSSProperties } from "react";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { diffPolicyPackContent, type PolicyPackDiffItem } from "@/lib/policy-pack-diff";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import type { PolicyPackVersion } from "@/types/policy-packs";

const headerRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "baseline",
  fontSize: 14,
  color: "#334155",
  marginBottom: 16,
};

const cardBase: CSSProperties = {
  borderRadius: 8,
  padding: 12,
  marginBottom: 10,
  border: "1px solid",
  fontSize: 14,
};

const cardAdded: CSSProperties = {
  ...cardBase,
  background: "#ecfdf5",
  borderColor: "#6ee7b7",
  color: "#064e3b",
};

const cardRemoved: CSSProperties = {
  ...cardBase,
  background: "#fef2f2",
  borderColor: "#fca5a5",
  color: "#7f1d1d",
};

const cardChanged: CSSProperties = {
  ...cardBase,
  background: "#fefce8",
  borderColor: "#fde047",
  color: "#713f12",
};

function cardStyle(changeType: "added" | "removed" | "changed"): CSSProperties {
  if (changeType === "added") {
    return cardAdded;
  }

  if (changeType === "removed") {
    return cardRemoved;
  }

  return cardChanged;
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
    <section aria-label="Policy pack version diff" style={{ marginTop: 20 }}>
      <h4 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Content diff</h4>
      <div style={headerRow}>
        <span>
          <strong>Left:</strong> <code style={{ fontSize: 13 }}>{leftVersion.version}</code>
          <span style={{ color: "#64748b", marginLeft: 8 }}>
            ({formatIsoUtcForDisplay(leftVersion.createdUtc)})
          </span>
        </span>
        <span aria-hidden="true" style={{ color: "#cbd5e1" }}>
          →
        </span>
        <span>
          <strong>Right:</strong> <code style={{ fontSize: 13 }}>{rightVersion.version}</code>
          <span style={{ color: "#64748b", marginLeft: 8 }}>
            ({formatIsoUtcForDisplay(rightVersion.createdUtc)})
          </span>
        </span>
      </div>

      {parseError !== null ? (
        <p role="alert" style={{ color: "#b91c1c", fontSize: 14 }}>
          {parseError}
        </p>
      ) : null}

      {parseError === null && items.length === 0 ? (
        <OperatorEmptyState title="No content differences">
          <p style={{ margin: 0, fontSize: 14 }}>Parsed JSON is structurally identical for these two versions.</p>
        </OperatorEmptyState>
      ) : null}

      {parseError === null && items.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li
              key={`${item.changeType}-${item.path}`}
              data-change-type={item.changeType}
              data-card-tone={item.changeType}
              data-diff-path={item.path}
              style={cardStyle(item.changeType)}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                <span data-diff-label>{changeLabel(item.changeType)}</span>
                {" · "}
                <code style={{ fontSize: 12 }}>{item.path}</code>
              </div>
              {item.changeType === "added" && item.rightValue !== undefined ? (
                <pre
                  data-diff-value="right"
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {item.rightValue}
                </pre>
              ) : null}
              {item.changeType === "removed" && item.leftValue !== undefined ? (
                <pre
                  data-diff-value="left"
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {item.leftValue}
                </pre>
              ) : null}
              {item.changeType === "changed" ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Before</div>
                    <pre
                      data-diff-value="left"
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: 12,
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {item.leftValue ?? "—"}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>After</div>
                    <pre
                      data-diff-value="right"
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: 12,
                        fontFamily: "ui-monospace, monospace",
                      }}
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
