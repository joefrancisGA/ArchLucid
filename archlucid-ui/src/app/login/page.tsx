import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Backward-compat shim: any hit to /login is forwarded to /auth/signin with query params preserved.
 * SessionIdleTimeoutGuard now redirects to /auth/session-expired directly, but external links or
 * bookmarks may still reference /login (or /auth/signin?reason=idle-timeout, still supported there).
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    }
  }

  const query = qs.toString();

  redirect(`/auth/signin${query.length > 0 ? `?${query}` : ""}`);
}
