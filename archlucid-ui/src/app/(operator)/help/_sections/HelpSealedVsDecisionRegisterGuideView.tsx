import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { DESK_IA_HELP_SEALED_VS_REGISTER_PATH } from "@/lib/desk-ia-help-sealed-vs-decision-register-route";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import {
  DESK_IA_HELP_SEALED_VS_REGISTER_OVERVIEW,
  DESK_IA_HELP_SEALED_VS_REGISTER_TITLE,
} from "@/lib/desk-ia-sealed-vs-decision-register-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { cn } from "@/lib/utils";

type HelpSealedVsDecisionRegisterGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** DI-023 — package (sealed review record) vs ledger (decision register). */
export function HelpSealedVsDecisionRegisterGuideView(
  props: HelpSealedVsDecisionRegisterGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-sealed-vs-decision-register-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={DESK_IA_HELP_SEALED_VS_REGISTER_TITLE}
        titleTestId="help-sealed-vs-decision-register-page-title"
        subtitle="Package vs disposition ledger."
        navHref={DESK_IA_HELP_SEALED_VS_REGISTER_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-sealed-vs-decision-register-overview"
      >
        {DESK_IA_HELP_SEALED_VS_REGISTER_OVERVIEW}
      </p>

      <SponsorSendPathHonestyPanel testIdPrefix="help-sealed-vs-decision-register" showSsoOptional={false} />

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-sealed-package-heading">
        <h2
          id="help-sealed-package-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Sealed review record
        </h2>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
          One finalized architecture package — manifest detail, exports, and findings for a single seal. Not a disposition
          ledger across the workspace.
        </p>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
          <a className="underline underline-offset-2" href={SIGNED_RECORDS_LIST_PATH}>
            Open sealed review records
          </a>
          {" "}to inspect the package manifest, artifact references, and verification state.
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-decision-register-heading">
        <h2
          id="help-decision-register-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Decision register
        </h2>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
          Rows of recorded architecture decisions and approval outcomes. Each row may link to the sealed package that
          locked the decision — the register is not the package itself.
        </p>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
          <a className="underline underline-offset-2" href={GOVERNANCE_DECISION_REGISTER_PATH}>
            Open the decision register
          </a>
          {" "}to review disposition history without treating it as package evidence.
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-seal-integrity-heading">
        <h2
          id="help-seal-integrity-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          What a seal proves
        </h2>
        <ul className={cn("m-0 list-disc space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
          <li>The manifest identifies the finalized package and the artifacts included in that package.</li>
          <li>Verification compares the recorded manifest integrity data with the stored package contents.</li>
          <li>A seal proves the state of that finalized package; it does not prove that later workspace decisions are unchanged.</li>
        </ul>
      </section>
    </article>
  );
}
