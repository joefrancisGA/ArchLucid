"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  FINDING_CAUSAL_CHAIN_OPEN_PARAM,
  findingCausalChainDisclosureHrefFromSearch,
  parseFindingCausalChainOpenFromSearch,
} from "@/lib/findings/finding-causal-chain-disclosure-url";
import {
  FINDING_CAUSAL_STEP_MISSING,
  type FindingCausalMiniChainResult,
} from "@/lib/findings/finding-causal-mini-chain";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingCausalMiniChainProps = {
  readonly chain: FindingCausalMiniChainResult;
  readonly className?: string;
  readonly defaultOpen?: boolean;
};

/** Expandable rule → evidence → recommendation disclosure beside finding derivation (TB-2217). */
export function FindingCausalMiniChain(props: FindingCausalMiniChainProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingCausalChainParam = searchParams.get(FINDING_CAUSAL_CHAIN_OPEN_PARAM);
  const [findingCausalChainOpen, setFindingCausalChainOpenState] = useState(() => {
    const fromUrl = parseFindingCausalChainOpenFromSearch(findingCausalChainParam);

    if (findingCausalChainParam !== null) {
      return fromUrl;
    }

    return props.defaultOpen === true;
  });
  const syncFindingCausalChainOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(findingCausalChainDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const setFindingCausalChainOpen = useCallback(
    (open: boolean) => {
      setFindingCausalChainOpenState(open);
      syncFindingCausalChainOpenToUrl(open);
    },
    [syncFindingCausalChainOpenToUrl],
  );
  const { chain, className } = props;

  useEffect(() => {
    if (findingCausalChainParam !== null) {
      setFindingCausalChainOpenState(parseFindingCausalChainOpenFromSearch(findingCausalChainParam));
    }
  }, [findingCausalChainParam]);

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      data-testid="finding-causal-mini-chain"
      open={findingCausalChainOpen}
      onToggle={(event) => setFindingCausalChainOpen(event.currentTarget.open)}
    >
      <summary className={cn("cursor-pointer select-none font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Causal chain
      </summary>
      <ol className={cn("m-0 mt-2 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {chain.steps.map((step, index) => (
          <li
            key={step.key}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            data-testid={`finding-causal-mini-chain-step-${step.key}`}
          >
            <span className="font-semibold text-al-text-primary">
              {index + 1}. {step.label}
            </span>
            <span
              className={cn(
                step.value !== null ? "text-al-text-secondary" : "italic text-neutral-500 dark:text-neutral-400",
              )}
              data-testid={`finding-causal-mini-chain-value-${step.key}`}
            >
              {step.value ?? FINDING_CAUSAL_STEP_MISSING}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
