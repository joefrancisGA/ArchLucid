"use client";

import type { ReactNode } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ProductLineSwitchBar } from "@/components/product-line/ProductLineSwitchBar";
import { SecurityProductHome } from "@/components/product-line/SecurityProductHome";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_BODY,
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE,
} from "@/lib/product-line/product-line-copy";

export function ProductLineHomeSwitch(props: { readonly architectureHome?: ReactNode }): React.JSX.Element {
  const { productLine } = useProductLine();

  if (productLine === "security") {
    return <SecurityProductHome />;
  }

  if (props.architectureHome !== undefined) {
    return <>{props.architectureHome}</>;
  }

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="architecture-home-security-env-hint">
      <OperatorPageHeader
        title={ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE}
        subtitle={ARCHITECTURE_HOME_SECURITY_ENV_HINT_BODY}
        navHref="/"
        headingLevel="h2"
      />
      <ProductLineSwitchBar />
    </OperatorPageContainer>
  );
}
