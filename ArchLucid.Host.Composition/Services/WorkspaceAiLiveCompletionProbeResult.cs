using ArchLucid.Core.Hosting;

namespace ArchLucid.Host.Composition.Services;

/// <summary>Outcome of a single live Azure OpenAI completion probe (not tenant-metered).</summary>
public sealed class WorkspaceAiLiveCompletionProbeResult
{
    public bool Succeeded { get; init; }

    public string DeploymentName { get; init; } = string.Empty;

    public string? ModelId { get; init; }

    public string Detail { get; init; } = string.Empty;

    public static WorkspaceAiLiveCompletionProbeResult Ok(string deploymentName, string? modelId, string responseSnippet) =>
        new()
        {
            Succeeded = true,
            DeploymentName = deploymentName,
            ModelId = modelId,
            Detail = string.IsNullOrWhiteSpace(responseSnippet)
                ? "Live completion probe succeeded."
                : $"Live completion probe succeeded (response length {responseSnippet.Trim().Length}).",
        };

    public static WorkspaceAiLiveCompletionProbeResult Failed(string deploymentName, string vendorDetail) =>
        new()
        {
            Succeeded = false,
            DeploymentName = deploymentName,
            Detail = vendorDetail,
        };

    public static WorkspaceAiLiveCompletionProbeResult TimedOut(string deploymentName, TimeSpan budget) =>
        Failed(
            deploymentName,
            AzureOpenAiVendorProbeErrorFormatter.FormatProbeTimedOut(deploymentName, budget));
}
