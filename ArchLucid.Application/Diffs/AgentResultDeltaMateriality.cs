namespace ArchLucid.Application.Diffs;

/// <summary>
///     Shared materiality checks for <see cref="AgentResultDelta" /> used by interpretation notes and export summaries.
/// </summary>
public static class AgentResultDeltaMateriality
{
    public static bool HasMaterialChanges(AgentResultDelta delta)
    {
        ArgumentNullException.ThrowIfNull(delta);

        if (delta.AddedClaims.Count > 0 || delta.RemovedClaims.Count > 0 ||
            delta.AddedFindings.Count > 0 || delta.RemovedFindings.Count > 0 ||
            delta.AddedRequiredControls.Count > 0 || delta.RemovedRequiredControls.Count > 0 ||
            delta.AddedWarnings.Count > 0 || delta.RemovedWarnings.Count > 0 ||
            delta.AddedEvidenceRefs.Count > 0 || delta.RemovedEvidenceRefs.Count > 0)
        {
            return true;
        }

        return delta.LeftConfidence != delta.RightConfidence;
    }

    public static bool AnyMaterialChanges(IEnumerable<AgentResultDelta> deltas) =>
        deltas.Any(HasMaterialChanges);

    public static int CountWithMaterialChanges(IEnumerable<AgentResultDelta> deltas) =>
        deltas.Count(HasMaterialChanges);
}
