using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Agents;

/// <summary>Projects one persisted agent trace into a structured tool-invocation ledger row (TB-110).</summary>
public static class AgentToolInvocationRecordProjector
{
    private const int ArgsPreviewMaxChars = 160;

    public static AgentToolInvocationRecord Project(
        Guid tenantId,
        Guid runId,
        AgentExecutionTrace trace,
        int sortOrder,
        int? durationMs)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (!Guid.TryParse(trace.RunId, out Guid traceRunId) || traceRunId != runId)
            throw new ArgumentException("Trace run id does not match the scoped run.", nameof(trace));

        string? responseSummary = trace.ParseSucceeded
            ? TruncatePreview(trace.ParsedResultJson)
            : null;

        return new AgentToolInvocationRecord
        {
            TenantId = tenantId,
            RunId = runId,
            TraceId = trace.TraceId,
            TaskId = trace.TaskId,
            SortOrder = sortOrder,
            ToolName = FormatToolName(trace.AgentType),
            ArgsPreview = TruncatePreview(trace.UserPrompt),
            ResponseSummary = responseSummary,
            Outcome = trace.ParseSucceeded ? "Succeeded" : "Failed",
            DurationMs = durationMs,
            BlobUploadFailed = trace.BlobUploadFailed == true,
            CompletenessNote = BuildCompletenessNote(trace),
            InvokedAtUtc = trace.CreatedUtc,
        };
    }

    private static string FormatToolName(AgentType agentType) => agentType switch
    {
        AgentType.Topology => "topology-agent",
        AgentType.Cost => "cost-agent",
        AgentType.Compliance => "compliance-agent",
        AgentType.Critic => "critic-agent",
        _ => $"{agentType}-agent",
    };

    private static string TruncatePreview(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return "—";

        string trimmed = raw.Trim().ReplaceLineEndings(" ");

        if (trimmed.Length <= ArgsPreviewMaxChars)
            return trimmed;

        return trimmed[..ArgsPreviewMaxChars] + "…";
    }

    private static string? BuildCompletenessNote(AgentExecutionTrace trace)
    {
        if (trace.BlobUploadFailed == true)
            return "Full prompt/response blobs may be missing (blobUploadFailed).";

        if (trace.InlineFallbackFailed == true)
            return "Inline SQL fallback for full trace text failed or was incomplete.";

        if (!trace.ParseSucceeded && !string.IsNullOrWhiteSpace(trace.ErrorMessage))
            return trace.ErrorMessage.Trim();

        return null;
    }
}
