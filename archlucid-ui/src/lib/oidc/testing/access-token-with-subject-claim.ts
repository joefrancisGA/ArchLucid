/** Unsigned JWT-shaped access tokens that satisfy `hasOidcSessionIdentityHints()` in unit tests. */
export function accessTokenWithSubjectClaim(sub: string = "user-test", name?: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(name === undefined ? { sub } : { sub, name })).toString("base64url");

  return `${header}.${payload}.sig`;
}
