"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  FindingsHelpEvidenceOrientationStrip as RegistryFindingsHelpEvidenceOrientationStrip,
} from "@/components/evidence-orientation/registry";

export function FindingsHelpEvidenceOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return <RegistryFindingsHelpEvidenceOrientationStrip productLineId={productLine} />;
}
