"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  useNavCallerAuthorityRank,
  useOperatorNavAuthority,
} from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ProductLineSwitchBar } from "@/components/product-line/ProductLineSwitchBar";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isDevEmployeeRoleOverrideActive } from "@/lib/dev-testing-overrides";
import { NAV_GROUPS } from "@/lib/nav-config";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import {
  SECURITY_PRODUCT_HOME_CLAIM_DISCIPLINE,
  SECURITY_PRODUCT_HOME_SUBTITLE,
  SECURITY_PRODUCT_HOME_TITLE,
} from "@/lib/product-line/product-line-copy";
import { isArchLucidVendorStaffPrincipal } from "@/lib/vendor-staff-principal";

export function SecurityProductHome(): React.JSX.Element {
  const { assignmentOverrides } = useProductLine();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const { currentPrincipal } = useOperatorNavAuthority();
  const showVendorInternalNav =
    isArchLucidVendorStaffPrincipal(currentPrincipal) || isDevEmployeeRoleOverrideActive();

  const destinations = useMemo(() => {
    return listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      callerAuthorityRank,
      "all",
      false,
      false,
      {
        showVendorInternalNav,
        productLine: "security",
        productLineAssignmentOverrides: assignmentOverrides,
      },
    )
      .flatMap((row) => row.visibleLinks)
      .filter((link) => link.href !== "/");
  }, [assignmentOverrides, callerAuthorityRank, showVendorInternalNav]);

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="security-product-home">
      <OperatorPageHeader
        title={SECURITY_PRODUCT_HOME_TITLE}
        subtitle={SECURITY_PRODUCT_HOME_SUBTITLE}
        claimDiscipline={SECURITY_PRODUCT_HOME_CLAIM_DISCIPLINE}
        navHref="/"
        headingLevel="h2"
      />
      <ProductLineSwitchBar />
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {destinations.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={OPERATOR_LINK.nav}>
              <span className={OPERATOR_TYPOGRAPHY.cardTitle}>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </OperatorPageContainer>
  );
}
