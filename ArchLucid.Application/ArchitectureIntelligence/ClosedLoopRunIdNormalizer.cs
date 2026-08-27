namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopRunIdNormalizer
{
    public static string NormalizeRequired(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return ClosedLoopRunIdComparer.Normalize(runId.Trim());
    }

    public static string? NormalizeOptional(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;

        return ClosedLoopRunIdComparer.Normalize(runId.Trim());
    }
}
