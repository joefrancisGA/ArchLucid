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
  login_requiredsssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  redirect_uri_nativeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "redirect_uri_mismatch",
  login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "login_required",
  interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "interaction_required",
  consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "consent_required",
  server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "server_error",
  invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "invalid_client",
  unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx: "unauthorized_client",
  insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "insufficient_scope",
  interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd: "interaction_required",
  invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
  access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: "access_denied",
  unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee: "unsupported_response_type",
  invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt: "invalid_grant",
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
