import type { NextRequest } from "next/server";

import { PRODUCT_LINE_UPSTREAM_HEADER } from "@/lib/product-line/product-line-http-header";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

/**
 * SecureNow shell forwards the optional product-line header on BFF proxy calls.
 * Architecture shell omits it so local dual-UI inherits deployment `both`.
 */
export function applyProductLineUpstreamHeader(headers: Headers, request: NextRequest): void {
  const incoming = request.headers.get(PRODUCT_LINE_UPSTREAM_HEADER)?.trim().toLowerCase() ?? "";

  if (incoming === "architecture" || incoming === "security") {
    headers.set(PRODUCT_LINE_UPSTREAM_HEADER, incoming);

    return;
  }

  const buildProductLine = resolveProductLineIdFromEnv();

  if (buildProductLine === "security") {
    headers.set(PRODUCT_LINE_UPSTREAM_HEADER, "security");
  }
}
