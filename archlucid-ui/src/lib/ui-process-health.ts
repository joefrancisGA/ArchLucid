import { readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";

/** JSON body for `GET /api/health` (Container Apps probes + build identity). */
export type UiProcessHealthBody = {
  status: "Healthy";
  commitSha: string;
  buildTimestamp: string;
  environment: string;
};

export function buildUiProcessHealthBody(): UiProcessHealthBody {
  const fingerprint = readClientDeploymentFingerprint();

  return {
    status: "Healthy",
    commitSha: fingerprint.frontendCommitSha,
    buildTimestamp: fingerprint.buildTimestamp,
    environment: fingerprint.environment,
  };
}
