import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactNode } from "react";

import { PrivacyPolicySectionCopyLink } from "@/components/marketing/privacy-policy/PrivacyPolicySectionCopyLink";
import {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
} from "@/lib/caiq-sig-response-help-presentation";
import { parseProcurementFaqQuestionNumber } from "@/lib/procurement-help-presentation";
import { resolveHelpHeadingId } from "@/lib/help/help-heading-slug";
import { PRIVACY_POLICY_PROSE } from "@/lib/privacy-policy-layout";

import { renderInline, type RenderInlineOptions } from "./MarketingAccessibilityMarkdownInline";

export type MarkdownHeadingStateUpdate = {
  readonly currentPartLabel?: string;
  readonly currentSectionTitle?: string;
  readonly currentSubsectionTitle?: string;
  readonly currentProcurementQuestionNumber?: number | null;
  readonly skippedDuplicateHelpTitle?: boolean;
};

export type MarketingAccessibilityMarkdownHeadingContext = {
  readonly key: number;
  readonly line: string;
  readonly isHelp: boolean;
  readonly isPrivacy: boolean;
  readonly isCaiqSigResponse: boolean;
  readonly isProcurementHelp: boolean;
  readonly skippedDuplicateHelpTitle: boolean;
  readonly h2Class: string;
  readonly h3Class: string;
  readonly renderOptions: RenderInlineOptions;
  readonly allocateSectionSlug: (headingRaw: string) => string;
};

export function tryRenderMarketingAccessibilityMarkdownHeading(
  ctx: MarketingAccessibilityMarkdownHeadingContext,
): { readonly node: ReactNode; readonly stateUpdate: MarkdownHeadingStateUpdate } | null {
  if (ctx.line.startsWith("## ") && !ctx.line.startsWith("###")) {
    const rawTitle = ctx.line.slice(3).trim();
    const { id: sectionId, title } = resolveHelpHeadingId(rawTitle, ctx.allocateSectionSlug);
    const stateUpdate: MarkdownHeadingStateUpdate =
      title === CAIQ_SIG_RESPONSE_LITE_PART_HEADING
        ? {
            currentPartLabel: CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
            currentSectionTitle: title,
            currentSubsectionTitle: "",
          }
        : title === CAIQ_SIG_RESPONSE_SIG_PART_HEADING
          ? {
              currentPartLabel: CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
              currentSectionTitle: title,
              currentSubsectionTitle: "",
            }
          : {
              currentSectionTitle: title,
              currentSubsectionTitle: "",
            };

    return {
      node: ctx.isPrivacy ? (
        <div key={`h2-wrap-${ctx.key}`} className={PRIVACY_POLICY_PROSE.sectionHeadingRow}>
          <h2 id={sectionId} className={ctx.h2Class}>
            {renderInline(title, `h2-${ctx.key}`, ctx.renderOptions)}
          </h2>
          <PrivacyPolicySectionCopyLink sectionId={sectionId} sectionTitle={title} />
        </div>
      ) : (
        <h2 key={`h2-${ctx.key}`} id={sectionId} className={ctx.h2Class}>
          {renderInline(title, `h2-${ctx.key}`, ctx.renderOptions)}
        </h2>
      ),
      stateUpdate,
    };
  }

  if (ctx.line.startsWith("# ") && !ctx.line.startsWith("##")) {
    if (ctx.isHelp && !ctx.skippedDuplicateHelpTitle) {
      return {
        node: null,
        stateUpdate: { skippedDuplicateHelpTitle: true },
      };
    }

    const title = ctx.line.slice(2).trim();

    return {
      node: (
        <h1 key={`h1-${ctx.key}`} className={cn("mt-2", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {renderInline(title, `h1-${ctx.key}`, ctx.renderOptions)}
        </h1>
      ),
      stateUpdate: {},
    };
  }

  if (ctx.line.startsWith("### ")) {
    const rawTitle = ctx.line.slice(4).trim();
    const { id: sectionId, title } = resolveHelpHeadingId(rawTitle, ctx.allocateSectionSlug);
    const stateUpdate: MarkdownHeadingStateUpdate = ctx.isCaiqSigResponse
      ? { currentSectionTitle: title }
      : ctx.isHelp
        ? {
            currentSubsectionTitle: title,
            currentProcurementQuestionNumber: ctx.isProcurementHelp
              ? parseProcurementFaqQuestionNumber(title)
              : null,
          }
        : {};

    return {
      node: ctx.isPrivacy ? (
        <div key={`h3-wrap-${ctx.key}`} className={PRIVACY_POLICY_PROSE.sectionH3Row}>
          <h3 id={sectionId} className={ctx.h3Class}>
            {renderInline(title, `h3-${ctx.key}`, ctx.renderOptions)}
          </h3>
          <PrivacyPolicySectionCopyLink sectionId={sectionId} sectionTitle={title} />
        </div>
      ) : (
        <h3 key={`h3-${ctx.key}`} id={sectionId} className={ctx.h3Class}>
          {renderInline(title, `h3-${ctx.key}`, ctx.renderOptions)}
        </h3>
      ),
      stateUpdate,
    };
  }

  return null;
}
