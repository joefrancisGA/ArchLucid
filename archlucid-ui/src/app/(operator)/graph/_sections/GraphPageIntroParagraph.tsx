import { GlossaryTooltip } from "@/components/GlossaryTooltip";

export type GraphPageIntroParagraphProps = {
  demoUi: boolean;
  buyerPolishedShell: boolean;
  leadIntro: string;
};

export function GraphPageIntroParagraph(props: GraphPageIntroParagraphProps) {
  const { demoUi, buyerPolishedShell, leadIntro } = props;

  return (
    <p className="m-0 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
      {leadIntro}{" "}
      {!(demoUi || buyerPolishedShell) ? (
        <span className="text-neutral-600 dark:text-neutral-400">
          Review trail mode emphasizes <GlossaryTooltip termKey="provenance">provenance</GlossaryTooltip> and how the
          package advances; architecture mode centers the{" "}
          <GlossaryTooltip termKey="knowledge_graph">knowledge graph</GlossaryTooltip> built from the captured context.
        </span>
      ) : null}
    </p>
  );
}
