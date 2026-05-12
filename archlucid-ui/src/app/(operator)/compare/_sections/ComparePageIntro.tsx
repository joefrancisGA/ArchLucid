import { GlossaryTooltip } from "@/components/GlossaryTooltip";

export type ComparePageIntroProps = {
  buyerPolished: boolean;
};

export function ComparePageIntro(props: ComparePageIntroProps) {
  const { buyerPolished } = props;

  return (
    <>
      <p className="max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300">
        {buyerPolished ? (
          <>
            Most teams compare the <strong>prior</strong> and <strong>later</strong> finalization for the{" "}
            <strong>same architecture request</strong> (N vs N+1). The structured summary below is the authoritative delta;
            open <strong>Summarize for sponsor</strong> only when you want a short narrative on top.
          </>
        ) : (
          <>
            Compare finalized manifests to understand what changed between two reviews—useful for sponsors, security
            review, and release checkpoints. <strong>Baseline</strong> is the reference;{" "}
            <strong>updated</strong> is what you are evaluating. After you compare, review the structured summary first;
            optional <strong>Summarize for sponsor</strong> adds a short narrative.
          </>
        )}
      </p>
      <p className="mb-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        The primary table is the <GlossaryTooltip termKey="manifest_diff">manifest diff</GlossaryTooltip> over finalized
        outputs. The service may persist a <GlossaryTooltip termKey="comparison_record">comparison record</GlossaryTooltip>{" "}
        for later replay.
      </p>
    </>
  );
}
