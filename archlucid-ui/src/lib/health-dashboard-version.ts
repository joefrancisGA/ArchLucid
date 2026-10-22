export type VersionInfoResponse = {
  application?: string;
  informationalVersion?: string;
  commitSha?: string | null;
  buildTimestamp?: string;
  deployStamp?: string;
  environment?: string;
  processUptimeSeconds?: number;
};
