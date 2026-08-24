export type OidcTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

function errorFromOAuthJson(json: unknown): Error | null {
  if (!json || typeof json !== "object") {
    return null;
  }

  const record = json as { error?: string; error_description?: string };
  const msg = [record.error, record.error_description].filter(Boolean).join(": ");

  if (!msg) {
    return null;
  }

  return new Error(msg);
}

async function readOAuthError(res: Response, bodyText: string): Promise<Error> {
  try {
    const json = JSON.parse(bodyText) as unknown;
    const oauthError = errorFromOAuthJson(json);

    if (oauthError) {
      return oauthError;
    }
  } catch {
    /* fall through */
  }

  return new Error(`Token endpoint error ${res.status}: ${bodyText.slice(0, 200)}`);
}

async function postTokenForm(
  tokenEndpoint: string,
  params: Record<string, string>,
): Promise<OidcTokenResponse> {
  const body = new URLSearchParams(params);
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw await readOAuthError(response, text);
  }

  const parsed = JSON.parse(text) as unknown;
  const oauthError = errorFromOAuthJson(parsed);

  if (oauthError) {
    throw oauthError;
  }

  return parsed as OidcTokenResponse;
}

export async function exchangeAuthorizationCode(params: {
  tokenEndpoint: string;
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<OidcTokenResponse> {
  return postTokenForm(params.tokenEndpoint, {
    grant_type: "authorization_code",
    client_id: params.clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
}

export async function refreshAccessToken(params: {
  tokenEndpoint: string;
  clientId: string;
  refreshToken: string;
}): Promise<OidcTokenResponse> {
  return postTokenForm(params.tokenEndpoint, {
    grant_type: "refresh_token",
    client_id: params.clientId,
    refresh_token: params.refreshToken,
  });
}
