import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { CaiqSigResponseHelpEvidenceCell } from "@/components/help/CaiqSigResponseHelpEvidenceCell";
import { CaiqSigResponseHelpStatusCell } from "@/components/help/CaiqSigResponseHelpStatusCell";
import { SecurityTrustHelpStatusCell } from "@/components/help/SecurityTrustHelpStatusCell";
import { ReviewGuideRequiredStatusCell } from "@/components/help/ReviewGuideRequiredStatusCell";
import { PRIVACY_POLICY_PROSE } from "@/lib/privacy-policy-layout";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { resolveCaiqSigHelpTableCaption } from "@/lib/caiq-sig-response-help-presentation";
import {
  helpScrollableTableRegionLabel,
  privacyScrollableTableRegionLabel,
  renderInline,
  type RenderInlineOptions,
} from "./MarketingAccessibilityMarkdownInline";

export function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|");
}

export function isTableDivider(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s|:-]+\|?$/.test(t) && t.includes("-");
}


export type MarketingAccessibilityMarkdownTableContext = {
  readonly key: number;
  readonly tableLines: readonly string[];
  readonly isPrivacy: boolean;
  readonly isHelp: boolean;
  readonly isCaiqSigResponse: boolean;
  readonly isSecurityTrustHelp: boolean;
  readonly isReviewGuideHelp: boolean;
  readonly tableCaptionProp: string;
  readonly privacyTableOrdinal: number;
  readonly helpTableOrdinal: number;
  readonly currentPartLabel: string;
  readonly currentSectionTitle: string;
  readonly currentSubsectionTitle: string;
  readonly tableTextClass: string;
  readonly renderOptions: RenderInlineOptions;
};

export function renderMarketingAccessibilityMarkdownTable(
  ctx: MarketingAccessibilityMarkdownTableContext,
): ReactNode {
  const bodyRows = ctx.tableLines.filter((r) => !isTableDivider(r));
  if (bodyRows.length === 0) {
    return null;
  }

  const headerCells = bodyRows[0]!
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const dataStart = isTableDivider(bodyRows[1] ?? "") ? 2 : 1;

  const nearestTableHeading =
    ctx.currentSubsectionTitle.length > 0
      ? ctx.currentSubsectionTitle
      : ctx.currentSectionTitle.length > 0
        ? ctx.currentSectionTitle
        : ctx.tableCaptionProp;

  const tableCaption = ctx.isPrivacy
    ? `${ctx.tableCaptionProp} ${ctx.privacyTableOrdinal}`
    : ctx.isCaiqSigResponse
      ? resolveCaiqSigHelpTableCaption(
          ctx.currentPartLabel.length > 0 ? ctx.currentPartLabel : "Questionnaire",
          ctx.currentSectionTitle.length > 0 ? ctx.currentSectionTitle : `Section ${ctx.helpTableOrdinal}`,
        ) + ` (${ctx.helpTableOrdinal})`
      : ctx.isHelp
        ? helpScrollableTableRegionLabel(nearestTableHeading, ctx.helpTableOrdinal)
        : ctx.tableCaptionProp;

  const statusColumnIndex = headerCells.findIndex((cell) => /^status$/i.test(cell));
  const responseColumnIndex = headerCells.findIndex((cell) => /^response$/i.test(cell));
  const evidenceColumnIndex = headerCells.findIndex((cell) => /^evidence$/i.test(cell));
  const requiredColumnIndex = headerCells.findIndex((cell) => /^required$/i.test(cell));
  const isReviewGuideFieldTable = ctx.isReviewGuideHelp && requiredColumnIndex >= 0;

  return (
<div
          key={`tbl-${ctx.key}`}
          className={
            ctx.isPrivacy
              ? PRIVACY_POLICY_PROSE.tableWrap
              : ctx.isHelp
                ? ctx.isCaiqSigResponse
                  ? HELP_PAGE_LAYOUT.compactTableWrap
                  : HELP_PAGE_LAYOUT.tableWrap
                : "my-4 overflow-x-auto"
          }
          {...(ctx.isPrivacy
            ? {
                tabIndex: 0 as const,
                role: "region" as const,
                "aria-label": privacyScrollableTableRegionLabel(ctx.privacyTableOrdinal),
              }
            : ctx.isHelp
              ? {
                  tabIndex: 0 as const,
                  role: "region" as const,
                  "aria-label": helpScrollableTableRegionLabel(nearestTableHeading, ctx.helpTableOrdinal),
                }
              : {})}
        >
          <table
            className={
              ctx.isPrivacy
                ? PRIVACY_POLICY_PROSE.table
                : ctx.isHelp
                  ? cn(HELP_PAGE_LAYOUT.table, isReviewGuideFieldTable && "min-w-[48rem]")
                  : cn("w-full border-collapse border border-neutral-200 dark:border-neutral-800", ctx.tableTextClass)
            }
          >
            <caption className="sr-only">{tableCaption}</caption>
            <thead className={ctx.isPrivacy || ctx.isHelp ? undefined : "bg-neutral-100 dark:bg-neutral-900"}>
              <tr>
                {headerCells.map((c, idx) => (
                  <th
                    key={`th-${ctx.key}-${idx}`}
                    scope="col"
                    className={
                      ctx.isPrivacy
                        ? PRIVACY_POLICY_PROSE.tableHeadCell
                        : ctx.isHelp
                          ? cn(
                              HELP_PAGE_LAYOUT.tableHeadCell,
                              isReviewGuideFieldTable && idx === 0 && "w-[11rem] whitespace-nowrap",
                              isReviewGuideFieldTable &&
                                idx === requiredColumnIndex &&
                                "w-[9rem] whitespace-nowrap",
                            )
                          : "border border-neutral-200 px-3 py-2 text-left font-semibold dark:border-neutral-800"
                    }
                  >
                    {renderInline(c, `th-${ctx.key}-${idx}`, ctx.renderOptions)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.slice(dataStart).map((row, rIdx) => {
                const cells = row
                  .split("|")
                  .map((c) => c.trim())
                  .filter((c) => c.length > 0);

                return (
                  <tr
                    key={`tr-${ctx.key}-${rIdx}`}
                    className={
                      ctx.isPrivacy
                        ? rIdx % 2 === 0
                          ? PRIVACY_POLICY_PROSE.tableRowOdd
                          : PRIVACY_POLICY_PROSE.tableRowEven
                        : ctx.isHelp
                          ? rIdx % 2 === 0
                            ? HELP_PAGE_LAYOUT.tableRowOdd
                            : HELP_PAGE_LAYOUT.tableRowEven
                          : "odd:bg-white even:bg-neutral-50 dark:odd:bg-neutral-950 dark:even:bg-neutral-900/60"
                    }
                  >
                    {cells.map((c, cIdx) => (
                      <td
                        key={`td-${ctx.key}-${rIdx}-${cIdx}`}
                        className={
                          ctx.isPrivacy
                            ? PRIVACY_POLICY_PROSE.tableBodyCell
                            : ctx.isHelp
                              ? cn(
                                  HELP_PAGE_LAYOUT.tableBodyCell,
                                  isReviewGuideFieldTable && cIdx === 0 && "w-[11rem] whitespace-nowrap",
                                  isReviewGuideFieldTable &&
                                    cIdx === requiredColumnIndex &&
                                    "w-[9rem] whitespace-nowrap",
                                )
                              : "border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                        }
                      >
                        {ctx.isCaiqSigResponse && cIdx === statusColumnIndex && statusColumnIndex >= 0 ? (
                          <CaiqSigResponseHelpStatusCell
                            statusLabel={c}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, ctx.renderOptions)}
                          />
                        ) : ctx.isSecurityTrustHelp && cIdx === statusColumnIndex && statusColumnIndex >= 0 ? (
                          <SecurityTrustHelpStatusCell
                            statusLabel={c}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, ctx.renderOptions)}
                          />
                        ) : ctx.isCaiqSigResponse &&
                          cIdx === responseColumnIndex &&
                          responseColumnIndex >= 0 ? (
                          <CaiqSigResponseHelpStatusCell
                            statusLabel={c}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, ctx.renderOptions)}
                          />
                        ) : ctx.isCaiqSigResponse && cIdx === evidenceColumnIndex && evidenceColumnIndex >= 0 ? (
                          <CaiqSigResponseHelpEvidenceCell
                            evidenceMarkdown={c}
                            statusLabel={statusColumnIndex >= 0 ? (cells[statusColumnIndex] ?? "") : undefined}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, ctx.renderOptions)}
                          />
                        ) : ctx.isReviewGuideHelp &&
                          cIdx === requiredColumnIndex &&
                          requiredColumnIndex >= 0 ? (
                          <ReviewGuideRequiredStatusCell statusLabel={c} />
                        ) : (
                          renderInline(c, `td-${ctx.key}-${rIdx}-${cIdx}`, ctx.renderOptions)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
  );
}
