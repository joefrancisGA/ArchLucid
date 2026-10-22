using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>Projects redacted invocation rows from persisted agent execution traces (TB-110).</summary>
public static partial class RunToolInvocationForensicsBuilder
{
    private const int ArgsPreviewMaxChars = 160;

    private const string TraceDerivedDisclaimer =
        "Rows are derived from persisted LLM execution traces, not a structured tool-call ledger. " +
        "Argument previews are truncated user-turn prompts; do not treat them as external API payloads.";

    private const string StructuredDisclaimer =
        "Rows are loaded from the structured tool-invocation ledger captured at trace persistence time.";

    public static RunToolInvocationForensicsResponse Build(
        string runId,
        IReadOnlyList<AgentExecutionTrace> traces,
        IReadOnlyList<AgentToolInvocationRecord>? structuredRecords = null)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("runId is required.", nameof(runId));

        ArgumentNullException.ThrowIfNull(traces);

        if (structuredRecords is { Count: > 0 })
            return BuildFromStructured(runId, structuredRecords, traces);

        return BuildFromTraces(runId, traces);
    }
}
