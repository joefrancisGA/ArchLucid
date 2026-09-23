"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FINDING_CAUSAL_CHAIN_OPEN_PARAM,
  findingCausalChainDisclosureHrefFromSearch,
  parseFindingCausalChainOpenFromSearch,
} from "@/lib/findings/finding-causal-chain-disclosure-url";
import {
  FINDING_CAUSAL_STEP_MISSING,
  type FindingCausalMiniChainResult,
} from "@/lib/findings/finding-causal-mini-chain";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingCausalMiniChainProps = {
  readonly chain: FindingCausalMiniChainResult;
  readonly className?: string;
  readonly defaultOpen?: boolean;
};

/** Expandable rule → evidence → recommendation disclosure beside finding derivation (TB-2217). */
export function FindingCausalMiniChain(props: FindingCausalMiniChainProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const readOpenFromUrl = (): boolean | null => {
    const param = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
      FINDING_CAUSAL_CHAIN_OPEN_PARAM,
    );

    if (param === null) {
      return null;
    }

    return parseFindingCausalChainOpenFromSearch(param);
  };
  const [findingCausalChainOpen, setFindingCausalChainOpenState] = useState(() => {
    const fromUrl = readOpenFromUrl();

    if (fromUrl !== null) {
      return fromUrl;
    }

    return props.defaultOpen === true;
  });
  const findingCausalChainOpenRef = useRef(findingCausalChainOpen);
  findingCausalChainOpenRef.current = findingCausalChainOpen;

  const syncFindingCausalChainOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingCausalChainDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setFindingCausalChainOpen = useCallback(
    (open: boolean) => {
      if (findingCausalChainOpenRef.current === open) {
        return;
      }

      findingCausalChainOpenRef.current = open;
      setFindingCausalChainOpenState(open);
      syncFindingCausalChainOpenToUrl(open);
    },
    [syncFindingCausalChainOpenToUrl],
  );

  const { chain, className } = props;

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const fromUrl = readOpenFromUrl();

      if (fromUrl === null) {
        return;
      }

      if (findingCausalChainOpenRef.current === fromUrl) {
        return;
      }

      findingCausalChainOpenRef.current = fromUrl;
      setFindingCausalChainOpenState(fromUrl);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      data-testid="finding-causal-mini-chain"
      open={findingCausalChainOpen}
      onToggle={(event) => {
        event.preventDefault();
        setFindingCausalChainOpen(!findingCausalChainOpenRef.current);
      }}
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
