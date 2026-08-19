import type { QuickScanResponse } from "./quick-scan-types";

export const QUICK_SCAN_SAMPLE_RESULT: QuickScanResponse = {
  scanId: "sample-quick-scan",
  systemName: "Claims intake API",
  primaryEnvironment: "Azure",
  summary:
    "The described workload shows a conventional three-tier pattern with clear external boundaries, but several controls need tightening before production scale.",
  findings: [
    {
      title: "Identity and access boundaries",
      description:
        "Service principals and human operators should use separate roles with least privilege. Review token lifetimes and rotation for APIs exposed to partners.",
      severity: 3,
    },
    {
      title: "Network segmentation",
      description:
        "Keep internal APIs and data stores on private endpoints. Deny-by-default ingress and explicit egress allow lists reduce lateral movement risk.",
      severity: 2,
    },
    {
      title: "Data protection",
      description:
        "Encrypt sensitive data at rest and in transit. Document key custody and whether backups are isolated from production credentials.",
      severity: 1,
    },
  ],
  positiveObservations: [
    "The architecture separates user-facing APIs from internal processing, which limits direct exposure of core services.",
    "Managed platform services reduce undifferentiated operational toil compared with self-hosted alternatives.",
  ],
  recommendedNextSteps: [
    "Run a full ArchLucid workspace review with evidence from diagrams, policies, and integration metadata.",
    "Validate disaster recovery and observability coverage for the highest-risk data paths.",
    "Request a guided demonstration if procurement needs a deeper walkthrough.",
  ],
  isSampleResult: true,
  demonstrationDisclaimer:
    "This is a demonstration result. It illustrates the kind of concise architecture feedback Quick Scan provides and is not a saved workspace review or a complete ArchLucid assessment.",
  completedUtc: "2026-01-01T00:00:00.000Z",
};
