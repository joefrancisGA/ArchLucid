export type ConfigurationHealthCheckRow = {
  readonly name: string;
  readonly status: string;
  readonly detail?: string | null;
};

export type ConfigurationHealthPayload = {
  readonly checks?: ConfigurationHealthCheckRow[];
};

export type AdminHealthConfigLintPayload = {
  hostingEnvironmentName?: string;
  blockingFindings?: Array<{ ruleName?: string; message?: string }>;
  advisoryFindings?: Array<{ ruleName?: string; message?: string }>;
};
