export const PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES = ["4.2 planning bridge", "6. related docs"] as const;

/**
 * TB-1717 — drops planning-bridge eng PRD from in-app pilot-feedback help.
 */


export function isPilotFeedbackContributorLeakageLine(line: string): boolean {
  if (/\/v1\//i.test(line)) {
    return true;
  }

  if (/ArchLucid:/i.test(line)) {
    return true;
  }

  if (/Swagger/i.test(line)) {
    return true;
  }

  if (/x-tenant-id|x-workspace-id|x-project-id/i.test(line)) {
    return true;
  }

  if (/LearningController/i.test(line)) {
    return true;
  }

  if (/ProductLearningPlanningMaterializeResult/i.test(line)) {
    return true;
  }

  if (/LearningPlanningQueryParser/i.test(line)) {
    return true;
  }

  if (/OperatorApiProblem/i.test(line)) {
    return true;
  }

  if (/openapi/i.test(line)) {
    return true;
  }

  if (/DATA_MODEL/i.test(line)) {
    return true;
  }

  if (/\/help\/governance-api-contracts|\/help\/api-contracts/i.test(line)) {
    return true;
  }

  if (/change_set_series|change set series/i.test(line)) {
    return true;
  }

  if (/API_CONTRACTS/i.test(line)) {
    return true;
  }

  if (/TEST_STRUCTURE/i.test(line)) {
    return true;
  }

  if (/archive\/CHANGE_SET/i.test(line)) {
    return true;
  }

  if (/archlucid-ui/i.test(line)) {
    return true;
  }

  if (/ARCHLUCID_API_BASE_URL/i.test(line)) {
    return true;
  }

  if (/ChangeSet=58R|FullyQualifiedName~ProductLearning/i.test(line)) {
    return true;
  }

  if (/^\*\*API:\*\*/i.test(line.trim())) {
    return true;
  }

  if (/^\| Goal \| Call \|/i.test(line.trim())) {
    return true;
  }

  if (/^\|.*\/v1\//i.test(line)) {
    return true;
  }

  if (/Administrator details — API and storage/i.test(line)) {
    return true;
  }

  if (/API \(same scope headers\)/i.test(line)) {
    return true;
  }

  if (/Each full load issues/i.test(line)) {
    return true;
  }

  if (/expandable API notes/i.test(line)) {
    return true;
  }

  if (/Correlation IDs:/i.test(line)) {
    return true;
  }

  if (/ProductLearningPlanningMaterialized/i.test(line)) {
    return true;
  }

  if (/learning\.planning_materialize_clicked/i.test(line)) {
    return true;
  }

  if (/ui-e2e-live|release-smoke|appsettings/i.test(line)) {
    return true;
  }

  if (/PlanningBridgePanel/i.test(line)) {
    return true;
  }

  if (/ProductLearningOpportunityScoring/i.test(line)) {
    return true;
  }

  if (/§4\.2 \(this doc\)/i.test(line)) {
    return true;
  }

  if (/^\*\*Tests:\*\*/i.test(line.trim())) {
    return true;
  }

  return false;
}

/**
 * TB-1717 — pilot-feedback help: strip SQL/API/StorageProvider/Swagger leakage; UI-first Admin guide.
 */


/** H2 sections omitted from in-app policy-pack-delta help (scripts, CI rehearsal, GTM index). */
