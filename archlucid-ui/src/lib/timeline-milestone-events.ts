/** Pipeline event types surfaced as milestones on buyer-polished review timelines (full feed on Audit). */
export function isTimelineMilestoneEvent(eventType: string): boolean {
  const key = eventType.trim();
  const milestones = new Set<string>([
    "Commit",
    "RunCompleted",
    "finalize.run",
    "run.finalized",
    "manifest.committed",
    "artifact.bundle.created",
    "com.archlucid.authority.run.completed",
    "com.archlucid.manifest.finalized.v1",
  ]);

  return milestones.has(key);
}
