/** Readable CSRF companion cookie (double-submit with the HttpOnly BFF session — LK-07). */
export const BFF_CSRF_COOKIE_NAME = "archlucid-bff-csrf" as const;

/** Required on mutating `/api/proxy` when the BFF session cookie is present. */
export const BFF_CSRF_HEADER = "X-Archlucid-Bff-Csrf" as const;
