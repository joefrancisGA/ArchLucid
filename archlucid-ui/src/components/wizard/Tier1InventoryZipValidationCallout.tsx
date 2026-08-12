import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";

type Tier1InventoryZipValidationCalloutProps = {
  message: string;
  testId?: string;
};

/** Client-side Tier-1 inventory ZIP validation failure with cloud-connections help link. */
export function Tier1InventoryZipValidationCallout(props: Tier1InventoryZipValidationCalloutProps) {
  return (
    <div data-testid={props.testId ?? "tier1-inventory-zip-validation-error"}>
      <OperatorErrorCallout>
        <strong>Inventory ZIP validation failed</strong>
        <p className="mt-2">{props.message}</p>
        <p className={cn("mt-2.5", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            href="/help/cloud-connections"
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            data-testid="tier1-inventory-zip-help-link"
          >
            Open cloud connections guide
          </Link>
          {" "}
          for platform-specific extractor steps and upload endpoints.
        </p>
      </OperatorErrorCallout>
    </div>
  );
}
