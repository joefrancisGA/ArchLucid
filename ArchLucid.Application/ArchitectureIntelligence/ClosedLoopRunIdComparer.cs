namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopRunIdComparer
{
    public static string Normalize(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return runId.Replace("-", string.Empty, StringComparison.Ordinal);
    }

    public static bool Equals(string left, string right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
            return false;

        return string.Equals(
            Normalize(left),
            Normalize(right),
            StringComparison.OrdinalIgnoreCase);
    }
}
