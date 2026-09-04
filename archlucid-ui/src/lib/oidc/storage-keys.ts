/** sessionStorage keys for OIDC token material (ArchLucid product rename). */
export const OIDC_ACCESS_TOKEN_KEY = "archlucid_oidc_access_token";
export const OIDC_REFRESH_TOKEN_KEY = "archlucid_oidc_refresh_token";
export const OIDC_EXPIRES_AT_MS_KEY = "archlucid_oidc_expires_at_ms";
export const OIDC_ID_TOKEN_KEY = "archlucid_oidc_id_token";
export const OIDC_OAUTH_STATE_KEY = "archlucid_oidc_oauth_state";
export const OIDC_CODE_VERIFIER_KEY = "archlucid_oidc_code_verifier";
export const OIDC_NONCE_KEY = "archlucid_oidc_nonce";
export const OIDC_GOOGLE_OAUTH_STATE_KEY = "archlucid_oidc_google_oauth_state";
export const OIDC_GOOGLE_CODE_VERIFIER_KEY = "archlucid_oidc_google_code_verifier";
export const OIDC_GOOGLE_NONCE_KEY = "archlucid_oidc_google_nonce";
/**
 * Temporary return-URL written before OIDC redirect and consumed by the callback.
 * Allows the app to restore the user's position after a session expiry sign-in.
 */
export const OIDC_POST_SIGN_IN_RETURN_URL_KEY = "archlucid_oidc_post_sign_in_return_url";
