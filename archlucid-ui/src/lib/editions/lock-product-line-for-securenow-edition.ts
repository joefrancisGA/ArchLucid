import { resolveSecureNowEditionId } from "@/lib/editions/resolve-securenow-edition-id";
import { secureNowEditionLocksProductLine } from "@/lib/editions/securenow-edition-id";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** UHG is a SecureNow deployment. That process cannot host the Architecture shell. */
export function lockProductLineForSecureNowEdition(productLine: ProductLineId): ProductLineId {
  if (secureNowEditionLocksProductLine(resolveSecureNowEditionId())) {
    return "security";
  }

  return productLine;
}

/** Generic SecureNow can still shuffle shells. UHG hides that switch. */
export function secureNowEditionShowsProductLineSwitch(): boolean {
  return !secureNowEditionLocksProductLine(resolveSecureNowEditionId());
}
