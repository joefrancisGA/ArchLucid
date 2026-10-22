import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

/** Maps provenance graph node kind strings to buyer-facing filter labels (BDA-093). */
export function buyerGraphNodeTypeLabel(kind: string): string {
  const normalized = kind.trim().toLowerCase();

  switch (normalized) {
    case "context":
    case "contextsnapshot":
      return "Context";

    case "finding":
    case "findingsnapshot":
      return "Finding";

    case "decision":
    case "decisiontrace":
      return "Decision";

    case "manifest":
    case "goldenmanifest":
      return SIGNED_MANIFEST_LABEL;

    case "governance":
    case "approval":
      return "Approval";

    case "audit":
    case "auditevent":
      return "Audit";

    case "artifact":
    case "artifactbundle":
      return "Deliverable";

    case "policy":
    case "policyrule":
      return "Policy";

    case "risk":
    case "warning":
      return "Monitored risk";

    default:
      return kind
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
