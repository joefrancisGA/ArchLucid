"use client";

import type { useGraphPage } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page";

type GraphPageViewModel = ReturnType<typeof useGraphPage>;

export type GraphPageToolbarProps = {
  readonly vm: GraphPageViewModel;
};

export function GraphPageToolbar(props: GraphPageToolbarProps): React.JSX.Element | null {
  const { vm } = props;

  if (vm.buyerPolishedShell || !vm.showOperatorControls || vm.effectiveGraph !== null) {
    return null;
  }

  return (
    <>
      {vm.savedViewsBar}
      {vm.controls}
    </>
  );
}
