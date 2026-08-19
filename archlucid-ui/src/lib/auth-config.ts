import { readNextPublicAuthMode } from "@/lib/legacy-arch-env";

/**
 * Authentication mode for the operator shell.
 * Values: "development-bypass" (default, no real sign-in), "jwt" / "jwt-bearer" (OIDC tokens).
 * Must match the API auth mode configuration (see API appsettings).
 */
export const AUTH_MODE = readNextPublicAuthMode();
