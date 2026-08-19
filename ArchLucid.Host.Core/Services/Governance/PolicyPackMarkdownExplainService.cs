using ArchLucid.AgentRuntime;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Services.Governance;

/// <summary>
///     LLM-backed Markdown explainer for raw policy pack JSON (<c>GET /v1/policy-packs/{id}/explain</c>).
/// </summary>
public sealed class PolicyPackMarkdownExplainService(
    IAgentCompletionClient completionClient,
    ILogger<PolicyPackMarkdownExplainService> logger)
{
    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ILogger<PolicyPackMarkdownExplainService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<string> SummarizePackJsonAsync(string packDisplayName, string contentJson, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(contentJson);

        const string system =
            "You are a precise governance analyst for ArchLucid. Summarize the provided policy pack JSON for an "
            + "operator audience. Output GitHub-flavored Markdown only with short sections such as Purpose, Key rules, "
            + "and Operational impact. Do not invent rules that are absent from the JSON. Stay under 400 words. "
            + PolicyPackExplainLlmPrompts.SimulatorRoutingMarker;

        string user =
            $"Policy pack name: {packDisplayName.Trim()}\n\nJSON:\n{contentJson.Trim()}";

        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Policy pack explain requested for '{PackName}'.", packDisplayName);

        return await _completionClient.CompleteJsonAsync(system, user, maxTokens: null, cancellationToken: ct)
            .ConfigureAwait(false);
    }
}
