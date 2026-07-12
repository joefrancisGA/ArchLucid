import type { Metadata } from "next";

import { ArchitectureCreationBootstrap } from "@/components/architecture/ArchitectureCreationBootstrap";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: CREATE_ARCHITECTURE_LABEL,
};

export default function NewArchitecturePage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <h2 className={cn("m-0 mt-6", OPERATOR_TYPOGRAPHY.pageTitle)}>{CREATE_ARCHITECTURE_LABEL}</h2>
      <p className={cn("mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
        Preparing your architecture draft…
      </p>
      <div className="mt-4">
        <ArchitectureCreationBootstrap />
      </div>
    </OperatorPageContainer>
  );
}
