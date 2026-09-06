"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  adminHealthLintRuleDisclosureHrefFromSearch,
  parseAdminHealthLintRuleIdFromSearch,
} from "@/lib/health-dashboard/admin-health-lint-rule-disclosure-url";

type AdminHealthLintRuleTechnicalDisclosureProps = {
  readonly ruleId: string;
};

export function AdminHealthLintRuleTechnicalDisclosure(
  props: AdminHealthLintRuleTechnicalDisclosureProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const adminHealthLintRuleIdParam = searchParams.get("adminHealthLintRuleId");
  const [open, setOpenState] = useState(
    () => parseAdminHealthLintRuleIdFromSearch(adminHealthLintRuleIdParam) === props.ruleId,
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        adminHealthLintRuleDisclosureHrefFromSearch(
          searchParams.toString(),
          detailsOpen ? props.ruleId : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, props.ruleId, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseAdminHealthLintRuleIdFromSearch(adminHealthLintRuleIdParam) === props.ruleId);
  }, [adminHealthLintRuleIdParam, props.ruleId]);

  return (
    <CollapsibleSection title="Technical details" open={open} onToggle={setOpen}>
      <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{props.ruleId}</p>
    </CollapsibleSection>
  );
}
