"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";

export type BuyerTitleHintProps = {
  readonly text: string;
};

/** Context hint for buyer-polished pages where the section purpose needs one-line clarification. */
export function BuyerTitleHint(props: BuyerTitleHintProps) {
  const text = props.text.trim();

  return (
    <FieldHelpTooltip
      label="this section"
      ariaLabel={`Help: this section`}
      hint={text}
      side="bottom"
    />
  );
}
