import { SecureNowMarketabilityBuyerPathStrip } from "@/components/product-line/SecureNowMarketabilityBuyerPathStrip";
import { resolveSecureNowMarketabilityBuyerPath } from "@/lib/product-line/resolve-securenow-marketability-buyer-path";

export type SecureNowMarketabilityBuyerPathAutoProps = {
  readonly testId: string;
  readonly enabled?: boolean;
};

export function SecureNowMarketabilityBuyerPathAuto(
  props: SecureNowMarketabilityBuyerPathAutoProps,
): React.JSX.Element | null {
  if (props.enabled === false) {
    return null;
  }

  return (
    <SecureNowMarketabilityBuyerPathStrip
      testId={props.testId}
      buyerPath={resolveSecureNowMarketabilityBuyerPath()}
    />
  );
}
