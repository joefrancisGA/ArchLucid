"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { SecureNowReaderInventoryPostureHonestyStrip } from "@/components/product-line/SecureNowReaderInventoryPostureHonestyStrip";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { resolveSecureNowReaderInventoryPostureHonesty } from "@/lib/product-line/resolve-securenow-reader-inventory-posture-honesty";

export type SecureNowReaderInventoryPostureHonestyAutoProps = { readonly testId: string; readonly enabled?: boolean };

export function SecureNowReaderInventoryPostureHonestyAuto(props: SecureNowReaderInventoryPostureHonestyAutoProps): React.JSX.Element | null {
  const { productLine } = useProductLine();
  if (props.enabled === false || !isSecureNowProductLine(productLine)) return null;
  return <SecureNowReaderInventoryPostureHonestyStrip testId={props.testId} honesty={resolveSecureNowReaderInventoryPostureHonesty()} />;
}
