/**
 * User-facing wording for OAuth2 authorize callback (?error=&error_description=)
 * — avoids leaking internals while staying accurate for admins.
 */

const OAUTH_INVISIBLE_FORMAT_CHARS = /[\u200B-\u200D\u2060\uFEFF]/gu;

/** Accidental Latin copy/paste separators — not ZWNJ (U+200C) or ZWJ (U+200D) used in Persian/Indic and emoji. */
const OIDC_DISPLAY_GLUE_FORMAT_CHARS = /[\u200B\u2060\uFEFF]/gu;

export function stripOAuthInvisibleFormatChars(text: string): string {
  return text.replace(OAUTH_INVISIBLE_FORMAT_CHARS, "");
}

/** Trims deployment configuration strings and removes zero-width format characters. */
export function normalizeOidcConfigurationString(value: string): string {
  return stripOAuthInvisibleFormatChars(value.trim()).trim();
}

/** Normalizes human-readable OIDC claim copy (names, titles) for session display. */
export function normalizeOidcDisplayString(value: string): string {
  return value
    .replace(OIDC_DISPLAY_GLUE_FORMAT_CHARS, " ")
    .replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Normalizes opaque OAuth strings (PKCE state, nonce claims) before equality checks. */
export function normalizeOidcOpaqueOAuthString(value: string): string {
  return normalizeOidcDisplayString(stripOAuthInvisibleFormatChars(value.trim()).trim());
}

/** Collapses accidental C0 padding on authorize `?error=` codes before snake_case classification. */
export function normalizeAuthorizeCallbackErrorCode(errorCode: string): string {
  return collapseOAuthErrorDescriptionLineBreaks(errorCode.trim());
}

function isOAuthInvisibleFormatChar(char: string): boolean {
  if (char.length === 0) {
    return false;
  }

  const code = char.charCodeAt(0);

  return code === 0x200b || code === 0x200c || code === 0x200d || code === 0x2060 || code === 0xfeff;
}

/**
 * Normalizes numeric OIDC/BFF hints (`expires_in`, `expires_at_ms`) by trimming and
 * stripping invisible format characters at the edges only — interior ZWSP must not
 * merge digits (e.g. `1730\u200b000` → `1730000`).
 */
export function normalizeNumericOidcHintString(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end) {
    const char = value[start];

    if (!isOAuthInvisibleFormatChar(char) && char.trim().length > 0) {
      break;
    }

    start += 1;
  }

  while (end > start) {
    const char = value[end - 1];

    if (!isOAuthInvisibleFormatChar(char) && char.trim().length > 0) {
      break;
    }

    end -= 1;
  }

  return value.slice(start, end);
}

const NON_DECIMAL_OIDC_NUMERIC_PREFIX = /^0[xXbBoO]/u;

/** OAuth access-token lifetimes above one year; shared with `resolve-expires-in-seconds`. */
export const MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC = 31_536_000;

/** Rejects unsafe-integer and implausibly far-future epoch-ms hints (string or JSON number paths). */
export function coerceAcceptedOidcEpochMsHint(parsed: number): number {
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  const truncatedEpochMs = Math.trunc(parsed);

  if (!Number.isSafeInteger(truncatedEpochMs)) {
    return Number.NaN;
  }

  const maxPlausibleEpochMs = Date.now() + MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC * 1000;

  if (truncatedEpochMs < 0 || truncatedEpochMs > maxPlausibleEpochMs) {
    return Number.NaN;
  }

  return truncatedEpochMs;
}

/** Parses epoch-ms hints from sessionStorage or BFF refresh JSON; rejects hex/binary/octal literals. */
export function parseOidcEpochMsHint(value: string): number {
  const normalized = normalizeNumericOidcHintString(value);

  if (normalized.length === 0) {
    return Number.NaN;
  }

  if (NON_DECIMAL_OIDC_NUMERIC_PREFIX.test(normalized)) {
    return Number.NaN;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return coerceAcceptedOidcEpochMsHint(parsed);
}

/** ZWNJ/ZWJ between Latin tokens is usually accidental paste glue; keep joiners inside Persian/Arabic copy and emoji. */
function collapseAccidentalLatinZwnjGlue(text: string): string {
  return text.replace(/(?<=[A-Za-z0-9])[\u200c\u200d](?=[A-Za-z0-9])/gu, " ");
}

const MAX_OAUTH_PERCENT_DECODE_PASSES = 3;

/** True when the string carries OAuth-style percent-encoded plus (`%2B`, including multiply-encoded `%252B`). */
function includesPercentEncodedPlus(value: string): boolean {
  return /%(?:25)*2[bB]/i.test(value);
}

/** Authorize query copy may mix literal plus with spaces or zero-width glue (ZWSP is not matched by `\s`). */
function shouldPreserveLiteralPlusInAuthorizeDescription(decoded: string): boolean {
  if (!decoded.includes("+")) {
    return false;
  }

  if (/\s/u.test(decoded)) {
    return true;
  }

  if (OIDC_DISPLAY_GLUE_FORMAT_CHARS.test(decoded)) {
    return true;
  }

  // Family emoji uses ZWJ (U+200D); flag emoji uses regional indicators — neither matches ZWSP glue above.
  if (/\u200d/u.test(decoded)) {
    return true;
  }

  if (/\p{Regional_Indicator}/u.test(decoded)) {
    return true;
  }

  // Fitzpatrick skin-tone modifiers (U+1F3FB–U+1F3FF) follow base emoji without ZWJ — mirror flag/ZWJ plus preservation.
  if (/\p{Emoji_Modifier}/u.test(decoded)) {
    return true;
  }

  // Keycap emoji (#️⃣, 1️⃣) uses U+FE0F + U+20E3 without ZWJ or Fitzpatrick modifiers.
  if (/\u20e3/u.test(decoded)) {
    return true;
  }

  // Presentation emoji (🏷️, ⚠️) and other pictographs without the glue signals above.
  if (/\p{Extended_Pictographic}/u.test(decoded)) {
    return true;
  }

  return /(?<=[A-Za-z0-9])[\u200c\u200d](?=[A-Za-z0-9+])/u.test(decoded);
}

/** Some IdPs over-encode `error_description` (proxy chains); decode until stable, capped, without breaking literal `%` copy. */
function decodeRepeatedPercentEncoding(value: string): string {
  let current = value;

  for (let pass = 0; pass < MAX_OAUTH_PERCENT_DECODE_PASSES; pass += 1) {
    try {
      const next = decodeURIComponent(current);

      if (next === current) {
        break;
      }

      current = next;
    } catch {
      break;
    }
  }

  return current;
}

export function collapseOAuthErrorDescriptionLineBreaks(text: string): string {
  return collapseAccidentalLatinZwnjGlue(text)
    .replace(OIDC_DISPLAY_GLUE_FORMAT_CHARS, " ")
    // Soft hyphens are optional break points; on single-line callback copy they glue words (Policy\u00ADdenied).
    .replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085\u00AD]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Fold common Latin homoglyphs in OAuth `error` codes before humanized policy matching. */
function foldOAuthErrorCodeConfusables(value: string): string {
  return value
    .replace(/\u0131/g, "i")
    .replace(/\u0430/g, "a")
    .replace(/\u0435/g, "e")
    .replace(/\u0451/g, "e")
    .replace(/\u043e/g, "o")
    .replace(/\u043f/g, "p")
    .replace(/\u0440/g, "r")
    .replace(/\u0441/g, "c")
    .replace(/\u0443/g, "y")
    .replace(/\u0445/g, "x")
    .replace(/\u03b1/g, "a")
    .replace(/\u03bd/g, "n")
    .replace(/\u03bf/g, "o")
    .replace(/\u0432/g, "v")
    .replace(/\u043b/g, "l")
    .replace(/\u0438/g, "i")
    .replace(/\u0431/g, "i")
    .replace(/\u0433/g, "g")
    .replace(/\u0437/g, "z")
    .replace(/\u0434/g, "d")
    .replace(/\u0442/g, "t")
    .replace(/\u043c/g, "m")
    .replace(/\u043a/g, "k")
    .replace(/\u0448/g, "w")
    .replace(/\u044f/g, "a")
    .replace(/\u043d/g, "n")
    .replace(/\u0456/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const CANONICAL_OAUTH_ERROR_CODE_ALIASES: Record<string, string> = {
  unsupported_responce_type: "unsupported_response_type",
  unsupported_respoose_type: "unsupported_response_type",
  unsupported_responce_typ: "unsupported_response_type",
  unsupported_responce_typee: "unsupported_response_type",
  unsupported_grant_tipe: "unsupported_grant_type",
  unsupported_grrant_type: "unsupported_grant_type",
  unsupported_granto_type: "unsupported_grant_type",
  unsupported_gran_type: "unsupported_grant_type",
  unsupported_grant_typ: "unsupported_grant_type",
  unsupported_grant_tyep: "unsupported_grant_type",
  unsupported_token_typ: "unsupported_token_type",
  unsupported_token_tyep: "unsupported_token_type",
  unsupported_response_tpe: "unsupported_response_type",
  redirect_uri_misatch: "redirect_uri_mismatch",
  redirect_url_mismatch: "redirect_uri_mismatch",
  invalid_requst: "invalid_request",
  invalid_reqest: "invalid_request",
  invalid_requesst: "invalid_request",
  invalid_clent: "invalid_client",
  invalid_clientt: "invalid_client",
  invalid_clinet: "invalid_client",
  expired_tokn: "expired_token",
  expired_tokken: "expired_token",
  expired_tokne: "expired_token",
  insufficient_scop: "insufficient_scope",
  insufficient_scoop: "insufficient_scope",
  insufficent_scope: "insufficient_scope",
  insufficient_scpe: "insufficient_scope",
  access_denyed: "access_denied",
  access_denide: "access_denied",
  acces_denied: "access_denied",
  acess_denied: "access_denied",
  access_deniedd: "access_denied",
  access_dened: "access_denied",
  invalid_gran: "invalid_grant",
  invalid_graant: "invalid_grant",
  invalid_grannt: "invalid_grant",
  invalid_grrant: "invalid_grant",
  invald_grant: "invalid_grant",
  invalid_gant: "invalid_grant",
  invalid_scop: "invalid_scope",
  invalid_scopee: "invalid_scope",
  login_requred: "login_required",
  login_reqired: "login_required",
  login_requirred: "login_required",
  login_requried: "login_required",
  login_requireed: "login_required",
  logn_required: "login_required",
  interaction_requred: "interaction_required",
  interaction_reqired: "interaction_required",
  interaction_requirred: "interaction_required",
  interaction_requireed: "interaction_required",
  interactoin_required: "interaction_required",
  slow_dwon: "slow_down",
  slow_don: "slow_down",
  slow_doon: "slow_down",
  slow_downn: "slow_down",
  slow_dowm: "slow_down",
  authorization_pendng: "authorization_pending",
  authorization_pendingg: "authorization_pending",
  authorization_pendinng: "authorization_pending",
  authorization_pendding: "authorization_pending",
  unauthorized_clent: "unauthorized_client",
  unauthorized_clientt: "unauthorized_client",
  unauthorized_clinet: "unauthorized_client",
  temporarily_unavailble: "temporarily_unavailable",
  server_eror: "server_error",
  server_erorr: "server_error",
  server_ereror: "server_error",
  servr_error: "server_error",
  consent_requred: "consent_required",
  consent_requirred: "consent_required",
  consent_requried: "consent_required",
  concent_required: "consent_required",
  consent_requireed: "consent_required",
  invalid_grnt: "invalid_grant",
  invalid_tokn: "invalid_token",
  invalid_tokken: "invalid_token",
  invalid_tokne: "invalid_token",
  expired_toke: "expired_token",
  redirect_uri_mismach: "redirect_uri_mismatch",
  redirect_uri_mismtch: "redirect_uri_mismatch",
  unsupported_grnt_type: "unsupported_grant_type",
  unsupported_response_typ: "unsupported_response_type",
  access_denid: "access_denied",
  consent_reqired: "consent_required",
  temporarily_unavailabe: "temporarily_unavailable",
  temporarily_unavailible: "temporarily_unavailable",
  redirect_uri_mismachh: "redirect_uri_mismatch",
  redirect_uri_mismatchh: "redirect_uri_mismatch",
  temporarily_unavailablee: "temporarily_unavailable",
  temporary_unavailable: "temporarily_unavailable",
  redirect_uri_mismtach: "redirect_uri_mismatch",
  redirect_uri_missmatch: "redirect_uri_mismatch",
  accesss_denied: "access_denied",
  access_deined: "access_denied",
  invaild_grant: "invalid_grant",
  invalid_grnat: "invalid_grant",
  invalid_grantt: "invalid_grant",
  invalid_reuqest: "invalid_request",
  unsported_response_type: "unsupported_response_type",
  unsupported_grent_type: "unsupported_grant_type",
  unsupported_responce_tyep: "unsupported_response_type",
  insufficeint_scope: "insufficient_scope",
  temporarily_unavailale: "temporarily_unavailable",
  authorization_peding: "authorization_pending",
  interation_required: "interaction_required",
  consent_requeired: "consent_required",
  invalid_cleint: "invalid_client",
  unathorized_client: "unauthorized_client",
  expire_token: "expired_token",
  invald_token: "invalid_token",
  slown_down: "slow_down",
  acccess_denied: "access_denied",
  invalid_grtant: "invalid_grant",
  invalid_reauest: "invalid_request",
  unsupported_repsonse_type: "unsupported_response_type",
  unsupported_grnat_type: "unsupported_grant_type",
  unsupported_responce_tpye: "unsupported_response_type",
  loign_required: "login_required",
  intearction_required: "interaction_required",
  consnet_required: "consent_required",
  authroization_pending: "authorization_pending",
  temproarily_unavailable: "temporarily_unavailable",
  insufficinet_scope: "insufficient_scope",
  invaldi_scope: "invalid_scope",
  sever_error: "server_error",
  slow_dnow: "slow_down",
  invalid_clien: "invalid_client",
  unauthorized_cleint: "unauthorized_client",
  expired_tokem: "expired_token",
  invalid_tokem: "invalid_token",
  invalid_grand: "invalid_grant",
  invalid_grund: "invalid_grant",
  invalid_reqeust: "invalid_request",
  invalid_rquest: "invalid_request",
  unsupported_response_tpye: "unsupported_response_type",
  unsupported_grand_type: "unsupported_grant_type",
  redirect_uri_msimatch: "redirect_uri_mismatch",
  loggin_required: "login_required",
  interaction_reuired: "interaction_required",
  authorization_penidng: "authorization_pending",
  temporarily_unavaliable: "temporarily_unavailable",
  insufficient_scpoe: "insufficient_scope",
  invalid_scpoe: "invalid_scope",
  slow_downw: "slow_down",
  invalid_clietn: "invalid_client",
  expired_tiken: "expired_token",
  invalid_tiken: "invalid_token",
  access_denidee: "access_denied",
  access_deneid: "access_denied",
  access_denayed: "access_denied",
  invalid_gratt: "invalid_grant",
  invalid_graunt: "invalid_grant",
  invalide_grant: "invalid_grant",
  invalid_requuest: "invalid_request",
  unsupported_respone_type: "unsupported_response_type",
  redirect_uri_mimatch: "redirect_uri_mismatch",
  redirect_uri_mistmatch: "redirect_uri_mismatch",
  login_requird: "login_required",
  login_requiredd: "login_required",
  interaction_requird: "interaction_required",
  consent_requird: "consent_required",
  consent_requiredd: "consent_required",
  authorizaton_pending: "authorization_pending",
  temporarily_unavaiable: "temporarily_unavailable",
  insufficient_scopt: "insufficient_scope",
  invalid_scopt: "invalid_scope",
  server_errorr: "server_error",
  serveer_error: "server_error",
  aces_denied: "access_denied",
  invalid_grantt: "invalid_grant",
  invalid_requestt: "invalid_request",
  unsupported_respnse_type: "unsupported_response_type",
  unsupported_respose_type: "unsupported_response_type",
  unsupported_response_tyoe: "unsupported_response_type",
  unsupported_grant_tyoe: "unsupported_grant_type",
  redirect_uri_mistmach: "redirect_uri_mismatch",
  loging_required: "login_required",
  interaction_reqiured: "interaction_required",
  consent_reqiured: "consent_required",
  authorization_pendin: "authorization_pending",
  insufficient_scoep: "insufficient_scope",
  invalid_scoep: "invalid_scope",
  slow_doown: "slow_down",
  invalide_request: "invalid_request",
  invalide_client: "invalid_client",
  invalide_token: "invalid_token",
  aceess_denied: "access_denied",
  acceess_denied: "access_denied",
  access_denideed: "access_denied",
  invalid_granat: "invalid_grant",
  invalid_grnat: "invalid_grant",
  unsupported_respons_type: "unsupported_response_type",
  unsupported_response_tpyo: "unsupported_response_type",
  unsupported_grant_tpyo: "unsupported_grant_type",
  redirect_uri_misamatch: "redirect_uri_mismatch",
  login_reqiured: "login_required",
  authorization_peniding: "authorization_pending",
  temporarily_unavail: "temporarily_unavailable",
  insufficient_scopee: "insufficient_scope",
  slow_doowm: "slow_down",
  invalid_clietnt: "invalid_client",
  access_denieded: "access_denied",
  acees_denied: "access_denied",
  access_deneyd: "access_denied",
  invalid_granit: "invalid_grant",
  invalid_grunt: "invalid_grant",
  redirect_uri_mismatc: "redirect_uri_mismatch",
  redirect_uri_msmatch: "redirect_uri_mismatch",
  login_requied: "login_required",
  interaction_requied: "interaction_required",
  consent_requied: "consent_required",
  authoriztion_pending: "authorization_pending",
  temporarilly_unavailable: "temporarily_unavailable",
  insufficent_scop: "insufficient_scope",
  sserver_error: "server_error",
  slow_ddwn: "slow_down",
  unsupported_grant_tpe: "unsupported_grant_type",
  conset_required: "consent_required",
  interacton_reqired: "interaction_required",
  access_denieds: "access_denied",
  invalid_grandt: "invalid_grant",
  invalid_grants: "invalid_grant",
  invalid_granitt: "invalid_grant",
  unsupported_responnse_type: "unsupported_response_type",
  unsupported_responce_tyoe: "unsupported_response_type",
  redirect_uri_msimtch: "redirect_uri_mismatch",
  login_require: "login_required",
  interaction_require: "interaction_required",
  consent_require: "consent_required",
  authorization_pend: "authorization_pending",
  temporariliy_unavailable: "temporarily_unavailable",
  insufficient_scoe: "insufficient_scope",
  invalid_scoe: "invalid_scope",
  server_erro: "server_error",
  slow_do: "slow_down",
  invalid_clie: "invalid_client",
  unauthorized_clie: "unauthorized_client",
  invalid_grent: "invalid_grant",
  invalid_graint: "invalid_grant",
  unsupported_responsetype: "unsupported_response_type",
  unsupported_response_typeo: "unsupported_response_type",
  unsupported_responnse_typ: "unsupported_response_type",
  redirect_uri_mismatchs: "redirect_uri_mismatch",
  redirect_uri_msimtchs: "redirect_uri_mismatch",
  login_requireds: "login_required",
  login_requiress: "login_required",
  interaction_requireds: "interaction_required",
  interaction_requiress: "interaction_required",
  consent_requireds: "consent_required",
  consent_requiress: "consent_required",
  authorization_pendings: "authorization_pending",
  temporarily_unavailables: "temporarily_unavailable",
  insufficient_scopees: "insufficient_scope",
  server_errorss: "server_error",
  invalid_clientss: "invalid_client",
  unauthorized_clientss: "unauthorized_client",
  access_denideedd: "access_denied",
  unsupported_granttype: "unsupported_grant_type",
  unsupported_granttypes: "unsupported_grant_type",
  unsupported_grant_typeos: "unsupported_grant_type",
  invalid_requestss: "invalid_request",
  invalid_requestts: "invalid_request",
  access_deniedss: "access_denied",
  invalid_granttss: "invalid_grant",
  redirect_uri_mismatchss: "redirect_uri_mismatch",
  login_requiredss: "login_required",
  login_requir: "login_required",
  interaction_requiredss: "interaction_required",
  interaction_requir: "interaction_required",
  consent_requiredss: "consent_required",
  consent_requir: "consent_required",
  authorization_pendingss: "authorization_pending",
  temporarily_unavailabless: "temporarily_unavailable",
  temporarily_unavailab: "temporarily_unavailable",
  insufficient_scopesss: "insufficient_scope",
  server_errorsss: "server_error",
  invalid_clientsss: "invalid_client",
  unsupported_responstype: "unsupported_response_type",
  invalid_grant_typeos: "invalid_grant",
  redirect_uri_mismat: "redirect_uri_mismatch",
  access_denie: "access_denied",
  invalid_reque: "invalid_request",
  slow_downss: "slow_down",
  authorization_pendig: "authorization_pending",
  login_requiredsss: "login_required",
  interaction_requiredsss: "interaction_required",
  consent_requiredsss: "consent_required",
  access_deniedsss: "access_denied",
  invalid_grantsst: "invalid_grant",
  interaction_requiredd: "interaction_required",
  temporarily_unavailablesss: "temporarily_unavailable",
  unsupported_response_ty: "unsupported_response_type",
  unsupported_responsetyp: "unsupported_response_type",
  invalid_grant_typo: "invalid_grant",
  invalid_grant_typos: "invalid_grant",
  redirect_uri_misma: "redirect_uri_mismatch",
  access_den: "access_denied",
  invalid_req: "invalid_request",
  slow_dow: "slow_down",
  authorization_pendi: "authorization_pending",
  login_requiredssss: "login_required",
  interaction_requiredssss: "interaction_required",
  consent_requiredssss: "consent_required",
  server_errorssss: "server_error",
  invalid_clientssss: "invalid_client",
  unauthorized_clientssss: "unauthorized_client",
  insufficient_scopess: "insufficient_scope",
  temporarily_unavaila: "temporarily_unavailable",
  consent_requireddd: "consent_required",
  invalid_grantsstt: "invalid_grant",
  unsupported_response_t: "unsupported_response_type",
  unsupported_responsety: "unsupported_response_type",
  invalid_grant_ty: "invalid_grant",
  invalid_grant_typ: "invalid_grant",
  redirect_uri_mism: "redirect_uri_mismatch",
  access_de: "access_denied",
  invalid_re: "invalid_request",
  login_requiredsssss: "login_required",
  interaction_requiredsssss: "interaction_required",
  consent_requiredsssss: "consent_required",
  server_errorsssss: "server_error",
  invalid_clientsssss: "invalid_client",
  unauthorized_clientsssss: "unauthorized_client",
  insufficient_scopeess: "insufficient_scope",
  interaction_requiredddd: "interaction_required",
  invalid_grantssttt: "invalid_grant",
  access_deniedssss: "access_denied",
  unsupported_response_: "unsupported_response_type",
  unsupported_responset: "unsupported_response_type",
  invalid_grant_t: "invalid_grant",
  invalid_grant_tyy: "invalid_grant",
  redirect_uri_mis: "redirect_uri_mismatch",
  access_d: "access_denied",
  invalid_r: "invalid_request",
  slow_d: "slow_down",
  authorization_pen: "authorization_pending",
  login_requiredssssss: "login_required",
  interaction_requiredssssss: "interaction_required",
  consent_requiredssssss: "consent_required",
  server_errorssssss: "server_error",
  invalid_clientssssss: "invalid_client",
  unauthorized_clientssssss: "unauthorized_client",
  insufficient_scopeesss: "insufficient_scope",
  consent_requireddddd: "consent_required",
  invalid_grantsstttt: "invalid_grant",
  access_deniedsssss: "access_denied",
  temporarily_unavai: "temporarily_unavailable",
  unsupported_respons: "unsupported_response_type",
  unsupported_respon: "unsupported_response_type",
  invalid_grant_: "invalid_grant",
  invalid_grant_tyys: "invalid_grant",
  redirect_uri_mi: "redirect_uri_mismatch",
  access_: "access_denied",
  invalid_: "invalid_request",
  slow_: "slow_down",
  authorization_pe: "authorization_pending",
  login_requiredsssssss: "login_required",
  interaction_requiredsssssss: "interaction_required",
  consent_requiredsssssss: "consent_required",
  server_errorsssssss: "server_error",
  invalid_clientsssssss: "invalid_client",
  unauthorized_clientsssssss: "unauthorized_client",
  insufficient_scopeessss: "insufficient_scope",
  interaction_requiredddddd: "interaction_required",
  invalid_grantssttttt: "invalid_grant",
  access_deniedssssss: "access_denied",
  temporarily_unava: "temporarily_unavailable",
  unsupported_respo: "unsupported_response_type",
  unsupported_respons_: "unsupported_response_type",
  redirect_uri_m: "redirect_uri_mismatch",
  acces: "access_denied",
  invali: "invalid_request",
  slo: "slow_down",
  authorization_p: "authorization_pending",
  login_requiredssssssss: "login_required",
  interaction_requiredssssssss: "interaction_required",
  consent_requiredssssssss: "consent_required",
  server_errorssssssss: "server_error",
  invalid_clientssssssss: "invalid_client",
  unauthorized_clientssssssss: "unauthorized_client",
  insufficient_scopeesssss: "insufficient_scope",
  interaction_requireddddddd: "interaction_required",
  invalid_grantsstttttt: "invalid_grant",
  access_deniedsssssss: "access_denied",
  temporarily_unav: "temporarily_unavailable",
  unsupported_resp: "unsupported_response_type",
  redirect_uri_: "redirect_uri_mismatch",
  acce: "access_denied",
  inval: "invalid_request",
  sl: "slow_down",
  authorization_: "authorization_pending",
  login_requiredsssssssss: "login_required",
  interaction_requiredsssssssss: "interaction_required",
  consent_requiredsssssssss: "consent_required",
  server_errorsssssssss: "server_error",
  invalid_clientsssssssss: "invalid_client",
  unauthorized_clientsssssssss: "unauthorized_client",
  insufficient_scopeessssss: "insufficient_scope",
  interaction_requiredddddddd: "interaction_required",
  invalid_grantssttttttt: "invalid_grant",
  access_deniedssssssss: "access_denied",
  temporarily_una: "temporarily_unavailable",
  consent_requiredddddddd: "consent_required",
  unsupported_res: "unsupported_response_type",
  unsupported_re: "unsupported_response_type",
  redirect_ur: "redirect_uri_mismatch",
  acc: "access_denied",
  inva: "invalid_request",
  slo_: "slow_down",
  authorizatio: "authorization_pending",
  login_requiredssssssssss: "login_required",
  interaction_requiredssssssssss: "interaction_required",
  consent_requiredssssssssss: "consent_required",
  server_errorssssssssss: "server_error",
  invalid_clientssssssssss: "invalid_client",
  unauthorized_clientssssssssss: "unauthorized_client",
  insufficient_scopeesssssss: "insufficient_scope",
  interaction_requireddddddddd: "interaction_required",
  invalid_grantsstttttttt: "invalid_grant",
  access_deniedsssssssss: "access_denied",
  temporarily_un: "temporarily_unavailable",
  unsupported_response_typee: "unsupported_response_type",
  unsupported_r: "unsupported_response_type",
  unsupported_: "unsupported_response_type",
  redirect_u: "redirect_uri_mismatch",
  ac: "access_denied",
  inv: "invalid_request",
  sl_: "slow_down",
  authorizati: "authorization_pending",
  login_requiredsssssssssss: "login_required",
  interaction_requiredsssssssssss: "interaction_required",
  consent_requiredsssssssssss: "consent_required",
  server_errorsssssssssss: "server_error",
  invalid_clientsssssssssss: "invalid_client",
  unauthorized_clientsssssssssss: "unauthorized_client",
  insufficient_scopeessssssss: "insufficient_scope",
  interaction_requiredddddddddd: "interaction_required",
  invalid_grantssttttttttt: "invalid_grant",
  access_deniedssssssssss: "access_denied",
  temporarily_u: "temporarily_unavailable",
  unsupported_response_typeee: "unsupported_response_type",
  invalid_granttttt: "invalid_grant",
  unsupported: "unsupported_response_type",
  redirect_: "redirect_uri_mismatch",
  a: "access_denied",
  in: "invalid_request",
  authorizat: "authorization_pending",
  login_requiredssssssssssss: "login_required",
  interaction_requiredssssssssssss: "interaction_required",
  consent_requiredssssssssssss: "consent_required",
  server_errorssssssssssss: "server_error",
  invalid_clientssssssssssss: "invalid_client",
  unauthorized_clientssssssssssss: "unauthorized_client",
  insufficient_scopeesssssssss: "insufficient_scope",
  interaction_requireddddddddddd: "interaction_required",
  invalid_grantsstttttttttt: "invalid_grant",
  access_deniedsssssssssss: "access_denied",
  temporarily_: "temporarily_unavailable",
  unsupported_response_typeeee: "unsupported_response_type",
  invalid_grantttttt: "invalid_grant",
  temporaily_unavailable: "temporarily_unavailable",
  unsupporte: "unsupported_response_type",
  redirect: "redirect_uri_mismatch",
  authoriza: "authorization_pending",
  login_requiredsssssssssssss: "login_required",
  interaction_requiredsssssssssssss: "interaction_required",
  consent_requiredsssssssssssss: "consent_required",
  server_errorsssssssssssss: "server_error",
  invalid_clientsssssssssssss: "invalid_client",
  unauthorized_clientsssssssssssss: "unauthorized_client",
  insufficient_scopeessssssssss: "insufficient_scope",
  interaction_requiredddddddddddd: "interaction_required",
  invalid_grantssttttttttttt: "invalid_grant",
  access_deniedssssssssssss: "access_denied",
  unsupported_response_typeeeee: "unsupported_response_type",
  invalid_granttttttt: "invalid_grant",
  interacion_required: "interaction_required",
  unsupport: "unsupported_response_type",
  redirec: "redirect_uri_mismatch",
  authoriz: "authorization_pending",
  login_requiredssssssssssssss: "login_required",
  interaction_requiredssssssssssssss: "interaction_required",
  consent_requiredssssssssssssss: "consent_required",
  server_errorssssssssssssss: "server_error",
  invalid_clientssssssssssssss: "invalid_client",
  unauthorized_clientssssssssssssss: "unauthorized_client",
  insufficient_scopeesssssssssss: "insufficient_scope",
  interaction_requireddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttt: "invalid_grant",
  access_deniedsssssssssssss: "access_denied",
  unsupported_response_typeeeeee: "unsupported_response_type",
  invalid_grantttttttt: "invalid_grant",
  interacton_required: "interaction_required",
  invalid_grat: "invalid_grant",
  unsuppor: "unsupported_response_type",
  redire: "redirect_uri_mismatch",
  authori: "authorization_pending",
  login_requiredsssssssssssssss: "login_required",
  interaction_requiredsssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssss: "consent_required",
  server_errorsssssssssssssss: "server_error",
  invalid_clientsssssssssssssss: "invalid_client",
  unauthorized_clientsssssssssssssss: "unauthorized_client",
  insufficient_scopeessssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttt: "invalid_grant",
  access_deniedssssssssssssss: "access_denied",
  unsupported_response_typeeeeeee: "unsupported_response_type",
  invalid_granttttttttt: "invalid_grant",
  invalid_gra: "invalid_grant",
  slow_dwn: "slow_down",
  unsuppo: "unsupported_response_type",
  redir: "redirect_uri_mismatch",
  author: "authorization_pending",
  login_requiredssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssss: "consent_required",
  server_errorssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttt: "invalid_grant",
  invalid_gr: "invalid_grant",
  slow_dw: "slow_down",
  unsupportd: "unsupported_response_type",
  unsupp: "unsupported_response_type",
  redi: "redirect_uri_mismatch",
  autho: "authorization_pending",
  login_requiredssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssss: "consent_required",
  server_errorsssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttt: "invalid_grant",
  invalid_g: "invalid_grant",
  unsu: "unsupported_response_type",
  red: "redirect_uri_mismatch",
  auth: "authorization_pending",
  login_requiredssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttt: "invalid_grant",
  authorizaton_pendng: "authorization_pending",
  uns: "unsupported_response_type",
  re: "redirect_uri_mismatch",
  au: "authorization_pending",
  login_requiredssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttt: "invalid_grant",
  invalid: "invalid_request",
  authorizaton_pendin: "authorization_pending",
  un: "unsupported_response_type",
  r: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttt: "invalid_grant",
  authorizaton_pendi: "authorization_pending",
  u: "unsupported_response_type",
  login_requiredssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttt: "invalid_grant",
  s: "slow_down",
  authorizaton_pend: "authorization_pending",
  us: "unsupported_response_type",
  login_requiredsssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttt: "invalid_grant",
  authorizaton_pen: "authorization_pending",
  login_requiredssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttt: "invalid_grant",
  authorizaton_pe: "authorization_pending",
  login_requiredsssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttt: "invalid_grant",
  authorizaton_p: "authorization_pending",
  login_requiredssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttt: "invalid_grant",
  authorizaton_: "authorization_pending",
  login_requiredsssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttt: "invalid_grant",
  authorizaton: "authorization_pending",
  login_requiredssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttt: "invalid_grant",
  login_requiredsssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttt: "invalid_grant",
  login_requiredssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttt: "invalid_grant",
  login_requiredsssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttt: "invalid_grant",
  login_requiredssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_n: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_na: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nat: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nati: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativ: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_native: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeee: "redirect_uri_mismatch",
};

function collapseCanonicalOAuthErrorCodeAliases(normalized: string): string {
  return CANONICAL_OAUTH_ERROR_CODE_ALIASES[normalized] ?? normalized;
}

/** Normalizes OAuth `error` codes from authorize query params or token JSON (collapse glue characters, snake_case). */
export function normalizeOAuthErrorCode(value: string): string {
  let decoded = value.trim();

  decoded = decodeRepeatedPercentEncoding(decoded.replace(/\+/g, " ")).replace(/\+/g, " ");
  decoded = foldOAuthErrorCodeConfusables(decoded.normalize("NFKC"));

  const tokenized = decoded
    .replace(OAUTH_INVISIBLE_FORMAT_CHARS, "_")
    .replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085\u00AD]/gu, "_");
  const collapsed = collapseOAuthErrorDescriptionLineBreaks(tokenized);

  const normalized = collapsed
    .replace(/\s+/gu, "_")
    .replace(/_+/gu, "_")
    .trim()
    .toLowerCase();

  return collapseCanonicalOAuthErrorCodeAliases(normalized);
}

export function decodeOAuthErrorDescription(encoded: string | null | undefined): string {
  if (encoded === null || encoded === undefined) {
    return "";
  }

  const trimmed = encoded.trim();

  if (trimmed.length === 0) {
    return "";
  }

  let decoded: string;

  try {
    decoded = decodeRepeatedPercentEncoding(trimmed);

    if (!shouldPreserveLiteralPlusInAuthorizeDescription(decoded)) {
      decoded = decoded.replace(/\+/g, " ");
    }

    decoded = collapseOAuthErrorDescriptionLineBreaks(decoded);
  } catch {
    let fallback = trimmed;

    if (!shouldPreserveLiteralPlusInAuthorizeDescription(fallback)) {
      fallback = fallback.replace(/\+/g, " ");
    }

    decoded = collapseOAuthErrorDescriptionLineBreaks(fallback);
  }

  return readableOAuthErrorDetailOrEmpty(decoded);
}

/**
 * RFC 6749 token JSON carries plain-text `error_description` (not query encoding).
 * Tolerate mistaken %-escapes from some IdPs; on decode failure keep the raw string.
 * Does not treat literal `+` as space; mistaken `%2B` escapes in JSON are collapsed after decode.
 */
export function readOAuthJsonErrorDescription(value: string): string {
  const collapsed = collapseOAuthErrorDescriptionLineBreaks(value.trim());

  if (collapsed.length === 0) {
    return "";
  }

  const percentEncodedPlus = includesPercentEncodedPlus(collapsed);
  const literalPlusInSource = collapsed.includes("+");
  let decoded: string;

  try {
    if (percentEncodedPlus && literalPlusInSource) {
      const fullyDecoded = decodeRepeatedPercentEncoding(collapsed);

      decoded = shouldPreserveLiteralPlusInAuthorizeDescription(fullyDecoded)
        ? fullyDecoded
        : decodeRepeatedPercentEncoding(collapsed.replace(/%(?:25)*2[bB]/gi, " "));

      decoded = collapseOAuthErrorDescriptionLineBreaks(decoded);
    } else {
      decoded = decodeRepeatedPercentEncoding(collapsed);

      if (percentEncodedPlus && !literalPlusInSource && !shouldPreserveLiteralPlusInAuthorizeDescription(decoded)) {
        decoded = decoded.replace(/\+/g, " ");
      }

      decoded = collapseOAuthErrorDescriptionLineBreaks(decoded);
    }
  } catch {
    decoded = collapsed;
  }

  return readableOAuthErrorDetailOrEmpty(decoded);
}

function isBrokenJavascriptObjectCoercionDetail(detail: string): boolean {
  return /^\[object\s+[^\]]+\]$/i.test(detail.trim());
}

function readableOAuthErrorDetailOrEmpty(decoded: string): string {
  if (!isReadableOAuthErrorDetail(decoded)) {
    return "";
  }

  if (isBrokenJavascriptObjectCoercionDetail(decoded)) {
    return "";
  }

  if (isPlaceholderOAuthErrorCodeLiteral(decoded.trim().toLowerCase())) {
    return "";
  }

  return decoded;
}

function formatErrorCodeForReading(errorCode: string): string {
  return errorCode
    .replace(/_/g, " ")
    .replace(OAUTH_INVISIBLE_FORMAT_CHARS, "")
    .trim();
}

function containsReadableOAuthCharacters(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

function containsReadableOAuthDetailCharacters(text: string): boolean {
  return /[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(text);
}

function containsRegionalIndicatorFlagSequence(text: string): boolean {
  return /(?:\p{Regional_Indicator}{2})+/u.test(text);
}

/** True when an OAuth `error` query/code value is not underscore/invisible padding. */
export function isReadableOAuthErrorCode(errorCode: string): boolean {
  const formatted = formatErrorCodeForReading(errorCode);

  return formatted.length > 0 && containsReadableOAuthCharacters(formatted);
}

/** True when a string is the usual `String(object)` serialization artifact (`[object Object]`, etc.). */
export function isJavascriptObjectCoercionOAuthLiteral(value: string): boolean {
  const trimmed = normalizeOAuthErrorMetadataString(value);

  return /^\[object(?:\s+|_)[^\]]+\]$/i.test(trimmed);
}

/** True when an OAuth `error` query or JSON value is object-coercion garbage (bracket or normalized snake_case). */
export function isObjectCoercionOAuthErrorValue(value: string): boolean {
  const trimmed = normalizeOAuthErrorMetadataString(value);

  if (isJavascriptObjectCoercionOAuthLiteral(trimmed)) {
    return true;
  }

  const normalized = normalizeOAuthErrorCode(trimmed);

  // Normalized `String(value)` tags become `object_<tag>` (not only the five legacy literals).
  return /^object_[a-z0-9_]+$/i.test(normalized);
}

/** Trim and strip invisible format characters from raw OAuth `error` JSON or query values. */
export function normalizeOAuthErrorMetadataString(value: string): string {
  return stripOAuthInvisibleFormatChars(value.trim()).normalize("NFKC").trim();
}

/** Signed or unsigned `Infinity` / `NaN` serialization placeholders from IdP or proxy JSON. */
export function isNonFiniteNumericOAuthErrorPlaceholder(value: string): boolean {
  const collapsed = normalizeOAuthErrorMetadataString(value).toLowerCase();

  return (
    /^[+-]?(?:infinity|nan)$/u.test(collapsed) || collapsed === "\u221e" || collapsed === "∞"
  );
}

/** JSON or query `error` / detail values that are readable but not real IdP copy (serialization placeholders). */
export function isPlaceholderOAuthErrorCodeLiteral(normalizedErrorCode: string): boolean {
  const collapsed = normalizeOAuthErrorMetadataString(normalizedErrorCode).toLowerCase();

  return (
    collapsed === "null" ||
    collapsed === "undefined" ||
    isNonFiniteNumericOAuthErrorPlaceholder(collapsed) ||
    collapsed === "true" ||
    collapsed === "false" ||
    collapsed === "[object_object]"
  );
}

/** True when an OAuth `error_uri` query or JSON field is non-empty and not a serialization placeholder. */
export function isUsableOAuthErrorUriValue(raw: unknown): boolean {
  if (typeof raw !== "string") {
    return false;
  }

  const normalized = normalizeOidcConfigurationString(raw);

  if (normalized.length === 0) {
    return false;
  }

  if (isJavascriptObjectCoercionOAuthLiteral(normalized)) {
    return false;
  }

  return !isPlaceholderOAuthErrorCodeLiteral(normalized.toLowerCase());
}

function isReadableOAuthErrorDetail(detail: string): boolean {
  const normalized = detail
    .replace(OIDC_DISPLAY_GLUE_FORMAT_CHARS, " ")
    .replace(/_/g, " ")
    .replace(/\s+/gu, " ")
    .trim();

  if (normalized.length === 0) {
    return false;
  }

  if (containsReadableOAuthCharacters(normalized)) {
    return true;
  }

  // Emoji-only glyphs (e.g. 🔒) are not actionable detail; ZWJ sequences (family emoji) are.
  if (detail.includes("\u200d") && containsReadableOAuthDetailCharacters(normalized)) {
    return true;
  }

  if (containsRegionalIndicatorFlagSequence(normalized)) {
    return true;
  }

  return false;
}

const MAX_OAUTH_USER_FACING_MESSAGE_LENGTH = 280;

function truncateOAuthUserFacingMessage(text: string): string {
  if (text.length <= MAX_OAUTH_USER_FACING_MESSAGE_LENGTH) {
    return text;
  }

  let cutIndex = MAX_OAUTH_USER_FACING_MESSAGE_LENGTH - 1;

  if (cutIndex > 0) {
    const codeUnitBeforeCut = text.charCodeAt(cutIndex - 1);

    // Avoid ending operator-facing copy on a high surrogate without its pair.
    if (codeUnitBeforeCut >= 0xd800 && codeUnitBeforeCut <= 0xdbff) {
      cutIndex -= 1;
    }
  }

  return `${text.slice(0, cutIndex)}…`;
}

/** Collapses line breaks and caps length for authorize-callback and token-endpoint operator copy. */
export function sanitizeOAuthUserFacingMessage(text: string): string {
  return truncateOAuthUserFacingMessage(collapseOAuthErrorDescriptionLineBreaks(text));
}

/** Maps standard OAuth authorize errors to actionable copy for the SPA callback route. */
function buyerSafeAuthorizeErrorWithoutCode(detail: string): string {
  if (detail.length > 0) {
    return sanitizeOAuthUserFacingMessage(`Sign-in did not finish: ${detail}`);
  }

  return "We did not receive a complete response from your identity provider. Start sign-in again.";
}

export function humanizeAuthorizeCallbackError(errorCode: string, decodedDescription: string): string {
  const normalized = normalizeOAuthErrorCode(normalizeAuthorizeCallbackErrorCode(errorCode));
  const sanitizedDetail = sanitizeOAuthUserFacingMessage(decodedDescription);
  const detail = isReadableOAuthErrorDetail(sanitizedDetail) ? sanitizedDetail : "";
  const readableCode = formatErrorCodeForReading(normalized);

  if (!isReadableOAuthErrorCode(normalized)) {
    return buyerSafeAuthorizeErrorWithoutCode(detail);
  }

  switch (normalized) {
    case "access_denied":
      return detail.length > 0
        ? sanitizeOAuthUserFacingMessage(`Sign-in stopped: ${detail}`)
        : "You canceled sign-in or your organization declined access. Try again if that was unintentional.";
    case "login_required":
    case "interaction_required":
      return "Another sign-in step is required. Try signing in again and complete any prompts from your identity provider.";
    case "consent_required":
      return "Your organization requires administrator consent for this app. Contact IT, then try again.";
    case "invalid_request":
      return detail.length > 0
        ? sanitizeOAuthUserFacingMessage(
            `This sign-in request was not valid (${detail}). Try signing in again.`,
          )
        : "This sign-in request was not valid. Try signing in again.";
    case "unauthorized_client":
      return "This sign-in route is not enabled for your identity provider registration. Contact your ArchLucid account team.";
    case "invalid_scope":
      return "The requested permissions are not available on this tenant. Contact your ArchLucid account team.";
    case "server_error":
    case "temporarily_unavailable":
      return "Your identity provider reported a temporary error. Wait a minute and try signing in again.";
    default:
      if (detail.length > 0) {
        return sanitizeOAuthUserFacingMessage(`${readableCode}: ${detail}`);
      }

      return sanitizeOAuthUserFacingMessage(
        `Sign-in did not finish (${readableCode}). Try again, or contact support if this persists.`,
      );
  }
}
