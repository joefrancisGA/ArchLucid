namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Derives run-level degradation signals from persisted <see cref="AgentExecutionTrace" /> rows (completion-resource
///     fallback uses <see cref="AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix" /> on
///     <see cref="AgentExecutionTrace.ModelDeploymentName" />).
/// </summary>
public static class AgentExecutionTraceDegradationProbe
{
    /// <summary>
    ///     <see langword="true" /> when <paramref name="modelDeploymentName" /> is non-empty and starts with
    ///     <see cref="AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix" />.
    /// </summary>
    public static bool LlmResourceFallbackModelDeployment(string? modelDeploymentName) =>
        !string.IsNullOrWhiteSpace(modelDeploymentName)
        && modelDeploymentName.StartsWith(
            AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix,
            StringComparison.Ordinal);

    /// <summary>Returns distinct <see cref="AgentExecutionTrace.AgentType" /> names that used completion-resource fallback.</summary>
    public static IReadOnlyList<string> DistinctOrderedAgentTypeNames(IEnumerable<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        return traces
            .Where(t => LlmResourceFallbackModelDeployment(t.ModelDeploymentName))
            .Select(static t => t.AgentType.ToString())
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static s => s, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
