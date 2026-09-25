"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  DataHandlingTenantIsolationHelpEvidenceOrientationStrip as RegistryDataHandlingTenantIsolationHelpEvidenceOrientationStrip,
} from "@/components/evidence-orientation/registry";

export function DataHandlingTenantIsolationHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <RegistryDataHandlingTenantIsolationHelpEvidenceOrientationStrip
      readingBodyClassName={props.readingBodyClassName}
      productLineId={productLine}
    />
  );
}
