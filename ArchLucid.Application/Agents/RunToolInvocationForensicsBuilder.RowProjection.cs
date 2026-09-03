using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Agents;

public static partial class RunToolInvocationForensicsBuilder
{
    private static string InferAgentTypeLabel(string toolName)
    {
        if (toolName.EndsWith("-agent", StringComparison.Ordinal))
            return toolName[..^6];

        return toolName;
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
