import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SYSTEM_GRAVITY_HELP_CONCEPT_TILES,
  SYSTEM_GRAVITY_HELP_OVERVIEW,
  SYSTEM_GRAVITY_HELP_TITLE,
} from "@/lib/system-gravity-help-guide-content";
import { SYSTEM_GRAVITY_HELP_PATH } from "@/lib/system-gravity-help-route";
import { cn } from "@/lib/utils";

type HelpSystemGravityGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** SG-107 — system vs job vs inspector orientation for `/help/system-gravity`. */
export function HelpSystemGravityGuideView(props: HelpSystemGravityGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), "flex flex-col gap-6")}
      data-testid="help-system-gravity-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SYSTEM_GRAVITY_HELP_TITLE}
        titleTestId="help-system-gravity-page-title"
        subtitle="Working instrument after spawn (ADR 0098)."
        navHref={SYSTEM_GRAVITY_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-system-gravity-overview">
        {SYSTEM_GRAVITY_HELP_OVERVIEW}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {SYSTEM_GRAVITY_HELP_CONCEPT_TILES.map((tile) => (
          <section
            key={tile.title}
            className="rounded-lg border border-border bg-card p-4"
            data-testid={`help-system-gravity-tile-${tile.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <h2 className="m-0 text-base font-semibold">{tile.title}</h2>
            <p className={cn("mt-2 mb-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}>{tile.body}</p>
          </section>
        ))}
      </div>

      <SponsorSendPathHonestyPanel testIdPrefix="help-system-gravity" showSsoOptional={false} />
    </article>
  );
}
