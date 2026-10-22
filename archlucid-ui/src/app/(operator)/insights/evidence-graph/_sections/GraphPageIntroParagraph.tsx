import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GraphPageIntroParagraphProps = {
  demoUi: boolean;
  buyerPolishedShell: boolean;
  leadIntro: string;
};

export function GraphPageIntroParagraph(props: GraphPageIntroParagraphProps) {
  const { demoUi, buyerPolishedShell, leadIntro } = props;

  return (
    <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.helper}`}>
      {leadIntro}{" "}
      {!(demoUi || buyerPolishedShell) ? (
        <span className="text-al-text-secondary">
          Review trail mode emphasizes <GlossaryTooltip termKey="provenance">provenance</GlossaryTooltip> and how the
          package advances; architecture mode centers the{" "}
          <GlossaryTooltip termKey="knowledge_graph">knowledge graph</GlossaryTooltip> built from the captured context.
        </span>
      ) : null}
    </p>
  );
}
