"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parsePolicyPacksBundledRuleKeysOpenFromSearch,
  policyPacksBundledRuleKeysDisclosureHrefFromSearch,
} from "@/lib/governance/policy-packs-bundled-rule-keys-disclosure-url";
import { cn } from "@/lib/utils";

type PolicyPacksBundledRuleKeysDisclosureProps = {
  readonly mergedKeysCount: number;
  readonly mergedKeyPreview: readonly string[];
  readonly mergedKeyRemainder: number;
};

/** Policy packs inspect bundled rule keys disclosure synced to URL. */
export function PolicyPacksBundledRuleKeysDisclosure(props: PolicyPacksBundledRuleKeysDisclosureProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const policyPacksBundledRuleKeysOpenParam = searchParams.get("policyPacksBundledRuleKeysOpen");
  const [open, setOpenState] = useState(() =>
    parsePolicyPacksBundledRuleKeysOpenFromSearch(policyPacksBundledRuleKeysOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        policyPacksBundledRuleKeysDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parsePolicyPacksBundledRuleKeysOpenFromSearch(policyPacksBundledRuleKeysOpenParam));
  }, [policyPacksBundledRuleKeysOpenParam]);

  const body: ReactNode = (
    <>
      <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        These stable keys anchor evaluation; titles, remediation, and framework mapping text live on each finding inspect
        view and in{" "}
        <code className={cn("rounded bg-neutral-100 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>
          docs/samples/policy-packs/*.json
        </code>{" "}
        /{" "}
        <code className={cn("rounded bg-neutral-100 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>
          docs/library/POLICY_PACK_APPENDIX_*
        </code>
        .
      </p>
      <ul
        className={cn(
          "mb-0 mt-3 max-h-48 list-disc overflow-y-auto pl-5 leading-relaxed text-al-text-primary md:columns-2 md:gap-6",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {props.mergedKeyPreview.map((k) => (
          <li key={k} className="break-all">
            {k}
          </li>
        ))}
      </ul>
      {props.mergedKeyRemainder > 0 ? (
        <p className={cn("mb-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          …and {props.mergedKeyRemainder} more.
        </p>
      ) : null}
    </>
  );

  return (
    <details
      className="mb-6 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Bundled compliance rule keys merged for this scope ({props.mergedKeysCount})
      </summary>
      {body}
    </details>
  );
}
