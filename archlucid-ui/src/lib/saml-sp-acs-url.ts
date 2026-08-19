/** SAML 2.0 Assertion Consumer Service path on the ArchLucid API host. */
export const SAML_SP_ACS_PATH = "/Auth/Saml2/Acs";

/**
 * Deliberately no origin-composing helper here. The ACS endpoint is served by the ArchLucid API
 * host, which is a different origin from this console whenever the UI and API are deployed
 * separately, and it is not reachable through the Next.js `/api/proxy` routes the way SCIM is.
 * Building the URL from `window.location.origin` would hand administrators a reply URL that never
 * receives SAML assertions, so callers render {@link SAML_SP_ACS_PATH} alongside the API host
 * instead of a fabricated absolute URL.
 */
