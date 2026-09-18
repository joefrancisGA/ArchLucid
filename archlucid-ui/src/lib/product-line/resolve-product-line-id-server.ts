import { cookies } from "next/headers";

import { isProductLineId, type ProductLineId } from "@/lib/product-line/product-line-id";
import { PRODUCT_LINE_COOKIE } from "@/lib/product-line/product-line-storage";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

/** Server Components / route handlers — cookie override then build env (matches client {@link resolveProductLineId}). */
export async function resolveProductLineIdForServer(): Promise<ProductLineId> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PRODUCT_LINE_COOKIE)?.value?.trim().toLowerCase();

  if (isProductLineId(raw)) {
    return raw;
  }

  return resolveProductLineIdFromEnv();
}
