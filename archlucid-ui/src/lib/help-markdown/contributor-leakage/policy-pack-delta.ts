export const POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES = [
  "local automation",
  "policy-to-decision proof pilot",
  "related",
] as const;

/**
 * TB-1727 — drops script/CI/GTM appendix sections from in-app policy-pack-delta help.
 */


export function isPolicyPackDeltaContributorLeakageLine(line: string): boolean {
  if (/\/v1\//i.test(line)) {
    return true;
  }

  if (/demo-policy-pack-delta\.ps1/i.test(line)) {
    return true;
  }

  if (/PreCommitGateEnabled/i.test(line)) {
    return true;
  }

  if (/ArchLucid:/i.test(line)) {
    return true;
  }

  if (/ReadAuthority|PolicyPackMutationAuthority|RequireAuditor/i.test(line)) {
    return true;
  }

  if (/x-tenant-id|x-workspace-id|x-project-id/i.test(line)) {
    return true;
  }

  if (/\bscripts\//i.test(line)) {
    return true;
  }

  if (/dotnet test|npx vitest|FullyQualifiedName/i.test(line)) {
    return true;
  }

  if (/tests\/fixtures\//i.test(line)) {
    return true;
  }

  if (/artifacts\/policy-pack-delta/i.test(line)) {
    return true;
  }

  if (/127\.0\.0\.1:5128/i.test(line)) {
    return true;
  }

  if (/policy-ab-demo-fixture/i.test(line)) {
    return true;
  }

  if (/PolicyAbDemoRegressionTests/i.test(line)) {
    return true;
  }

  if (/PolicyPackBeforeAfterDiffDemoTests/i.test(line)) {
    return true;
  }

  if (/\*\*Automation:\*\*/i.test(line)) {
    return true;
  }

  if (/\*\*Pilot sequencing:\*\*/i.test(line)) {
    return true;
  }

  if (/GTM_BACKLOG|QUOTE_TO_PROOF_PACKET|BUYER_SECURITY_PROCUREMENT|DIFFERENTIATION_PROOF_PACKET/i.test(line)) {
    return true;
  }

  if (/LATEST_GPT55|assessments\//i.test(line)) {
    return true;
  }

  if (/gateResult\.blocked|wouldBlockCommit|blockCommitMinimumSeverity|blockCommitOnCritical/i.test(line)) {
    return true;
  }

  if (/policyPackContentJson|syntheticSeverity|syntheticCount|proposedThresholds|evaluateAgainstRunIds/i.test(line)) {
    return true;
  }

  if (/^### API\b/i.test(line.trim())) {
    return true;
  }

  if (/^```http\b/i.test(line.trim())) {
    return true;
  }

  if (/^```powershell\b/i.test(line.trim())) {
    return true;
  }

  if (/^\|\s*[-:| ]+\|\s*$/i.test(line.trim())) {
    return true;
  }

  return false;
}

/**
 * TB-1727 — policy-pack-delta help: strip HTTP/config/script/GUID leakage; UI-first Admin demo guide.
 */


/**
 * TB-1733 — prior-manifest help: strip host config keys; state default limit in operator language.
 */


