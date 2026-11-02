namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Normalizes task ids for evaluation joins so trace upsert trimming matches result lookups.
/// </summary>
internal static class AgentEvaluationTaskIdKey
{
    internal static string? Normalize(string? taskId)
    {
        string? trimmed = taskId?.Trim();

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    internal static bool Equals(string? left, string? right) =>
        string.Equals(Normalize(left), Normalize(right), StringComparison.OrdinalIgnoreCase);
}
