export type AdminHealthConfigLintPayload = {
  hostingEnvironmentName?: string;
  blockingFindings?: Array<{ ruleName?: string; message?: string }>;
  advisoryFindings?: Array<{ ruleName?: string; message?: string }>;
};
