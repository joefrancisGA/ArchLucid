import type { Metadata } from "next";

import { ArchitectureCreationBootstrap } from "@/components/architecture/ArchitectureCreationBootstrap";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { ARCHITECTURE_CREATION_BOOTSTRAP_LEAD } from "@/lib/create-vs-review-intake-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: CREATE_ARCHITECTURE_LABEL,
};

export default function NewArchitecturePage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <PageHeading
        navHref={ARCHITECTURES_NEW_PATH}
        title={CREATE_ARCHITECTURE_LABEL}
        headingLevel="h2"
        className="mt-6"
        description={
          <p
            className={cn("m-0 mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="architecture-creation-bootstrap-lead"
          >
            {ARCHITECTURE_CREATION_BOOTSTRAP_LEAD}
          </p>
        }
      />
      <div className="mt-4">
        <ArchitectureCreationBootstrap />
      </div>
    </OperatorPageContainer>
  );
}
