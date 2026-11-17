import { normalizeGovernanceQueueFindingId } from "@/lib/governance/governance-findings-queue-selection";
import { REMEDIATION_FACTORY_ROW_ATTR } from "@/hooks/useRemediationFactoryShortcuts";

const FINDING_EVIDENCE_LINK_SELECTOR = 'a[data-testid$="-evidence-link"]';

const PATH_INSPECT_EVIDENCE_LINK_SELECTORS: readonly string[] = [
  '[data-testid="security-evidence-path-hop-resource-evidence"]',
  '[data-testid="security-evidence-path-advisory-instance-link"]',
  'a[href*="remediation"]',
];

function focusHTMLElement(element: HTMLElement | null): boolean {
  if (element === null) {
    return false;
  }

  element.focus();

  return true;
}

function queryGovernanceFindingCardElement(findingId: string): HTMLElement | null {
  const normalized = normalizeGovernanceQueueFindingId(findingId);

  if (normalized.length === 0) {
    return null;
  }

  const direct = document.querySelector<HTMLElement>(`[data-finding-id="${CSS.escape(normalized)}"]`);

  if (direct !== null) {
    return direct;
  }

  for (const element of document.querySelectorAll<HTMLElement>("[data-finding-id]")) {
    if (normalizeGovernanceQueueFindingId(element.getAttribute("data-finding-id") ?? "") === normalized) {
      return element;
    }
  }

  return null;
}

export function focusFindingCardEvidenceLink(findingId: string | null): boolean {
  if (findingId === null || findingId.trim().length === 0) {
    return false;
  }

  const card = queryGovernanceFindingCardElement(findingId);

  if (card === null) {
    return false;
  }

  const evidenceLink = card.querySelector<HTMLElement>(FINDING_EVIDENCE_LINK_SELECTOR);

  return focusHTMLElement(evidenceLink);
}

export function focusFindingCardRow(findingId: string | null): boolean {
  if (findingId === null || findingId.trim().length === 0) {
    return false;
  }

  const card = queryGovernanceFindingCardElement(findingId);

  return focusHTMLElement(card);
}

export function focusSecurityEvidencePathInspectEvidenceLink(panel: HTMLElement | null): boolean {
  if (panel === null) {
    return false;
  }

  for (const selector of PATH_INSPECT_EVIDENCE_LINK_SELECTORS) {
    const link = panel.querySelector<HTMLElement>(selector);

    if (link !== null) {
      return focusHTMLElement(link);
    }
  }

  return false;
}

export function focusGovernanceFindingsQueueEvidence(
  findingId: string | null,
  pathInspectPanel: HTMLElement | null,
): boolean {
  if (focusFindingCardEvidenceLink(findingId)) {
    return true;
  }

  return focusSecurityEvidencePathInspectEvidenceLink(pathInspectPanel);
}

export function focusRemediationFactoryQueueRow(rowId: string | null): boolean {
  if (rowId === null || rowId.trim().length === 0) {
    return false;
  }

  const row = document.querySelector<HTMLElement>(`[${REMEDIATION_FACTORY_ROW_ATTR}="${rowId}"]`);

  return focusHTMLElement(row);
}

export function focusRemediationFactoryEvidence(
  rowId: string | null,
  pathInspectPanel: HTMLElement | null,
): boolean {
  if (rowId !== null && rowId.trim().length > 0) {
    const row = document.querySelector<HTMLElement>(`[${REMEDIATION_FACTORY_ROW_ATTR}="${rowId}"]`);

    if (row !== null) {
      const rowEvidence = row.querySelector<HTMLElement>(FINDING_EVIDENCE_LINK_SELECTOR);

      if (focusHTMLElement(rowEvidence)) {
        return true;
      }
    }
  }

  return focusSecurityEvidencePathInspectEvidenceLink(pathInspectPanel);
}
