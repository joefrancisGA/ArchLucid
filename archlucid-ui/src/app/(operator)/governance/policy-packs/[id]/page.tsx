import { redirect } from "next/navigation";

import { PolicyPackDetailClient } from "./PolicyPackDetailClient";

/** Reject obviously invalid route params (e.g. literal "undefined" leaked from client links). */
function isValidPolicyPackDetailId(raw: string): boolean {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  if (lower === "undefined" || lower === "null") {
    return false;
  }

  return true;
}

export default async function PolicyPackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidPolicyPackDetailId(id)) {
    redirect("/governance");
  }

  return <PolicyPackDetailClient policyPackId={id.trim()} />;
}
