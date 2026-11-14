/** Hosted SaaS posture — operators do not paste Azure OpenAI keys for the standard ArchLucid path. */
export const ARCHLUCID_HOSTED_SAAS_OPENAI_COPY =
  "ArchLucid-hosted workspaces use platform-provisioned Azure OpenAI. You do not need to paste model keys for the standard review path." as const;

export const SECURENOW_HOSTED_SAAS_OPENAI_COPY =
  "SecureNow-hosted workspaces use platform-provisioned Azure OpenAI for path explanations when Real agent mode is enabled. Paste keys only on self-hosted deployments." as const;
