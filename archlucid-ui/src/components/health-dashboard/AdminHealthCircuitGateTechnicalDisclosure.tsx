"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  adminHealthCircuitGateDisclosureHrefFromSearch,
  parseAdminHealthCircuitGateIdFromSearch,
} from "@/lib/health-dashboard/admin-health-circuit-gate-disclosure-url";
import { cn } from "@/lib/utils";

type AdminHealthCircuitGateTechnicalDisclosureProps = {
  readonly gateName: string;
  readonly breakDurationSeconds: number | null;
};

export function AdminHealthCircuitGateTechnicalDisclosure(
  props: AdminHealthCircuitGateTechnicalDisclosureProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const adminHealthCircuitGateIdParam = searchParams.get("adminHealthCircuitGateId");
  const [open, setOpenState] = useState(
    () => parseAdminHealthCircuitGateIdFromSearch(adminHealthCircuitGateIdParam) === props.gateName,
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        adminHealthCircuitGateDisclosureHrefFromSearch(
          searchParams.toString(),
          detailsOpen ? props.gateName : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, props.gateName, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseAdminHealthCircuitGateIdFromSearch(adminHealthCircuitGateIdParam) === props.gateName);
  }, [adminHealthCircuitGateIdParam, props.gateName]);

  return (
    <CollapsibleSection title="Technical details" open={open} onToggle={setOpen}>
      <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{props.gateName}</p>
      {props.breakDurationSeconds != null ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Open duration: {props.breakDurationSeconds}s
        </p>
      ) : null}
    </CollapsibleSection>
  );
}
