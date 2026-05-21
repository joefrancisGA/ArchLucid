using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Governance;

public sealed class PreCommitGovernanceBlockExplainer(
    IAgentCompletionClient completionClient) : IPreCommitGovernanceBlockExplainer
{
    private const string Prompt =
        "Policy rule enforcement blocked an architecture manifest commit. " +
        "In two sentences: (1) explain why this rule exists, (2) describe the minimum manifest change that would satisfy it. " +
        "Use only the supplied gate result and manifest excerpt.";

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<string?> ExplainAsync(
        PreCommitGateResult gateResult,
        string truncatedManifestJson,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(gateResult);
        ArgumentNullException.ThrowIfNull(truncatedManifestJson);

        string userPrompt =
            $"Gate reason: {gateResult.Reason ?? "unknown"}\n" +
            $"Policy pack id: {gateResult.PolicyPackId ?? "unknown"}\n" +
            $"Minimum blocking severity: {gateResult.MinimumBlockingSeverity?.ToString() ?? "unknown"}\n" +
            $"Blocking finding ids: {(gateResult.BlockingFindingIds.Count == 0 ? "(none)" : string.Join(", ", gateResult.BlockingFindingIds))}\n\n" +
            "Manifest excerpt:\n" +
            truncatedManifestJson;

        string response = await _completionClient.CompleteJsonAsync(
            Prompt,
            userPrompt,
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        return string.IsNullOrWhiteSpace(response) ? null : response.Trim();
    }
}
