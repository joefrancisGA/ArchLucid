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
            $"Gate reason: {FormatOptionalField(gateResult.Reason, "Gate reason")}\n" +
            $"Policy pack id: {FormatOptionalField(gateResult.PolicyPackId, "Policy pack id")}\n" +
            $"Minimum blocking severity: {FormatMinimumBlockingSeverity(gateResult.MinimumBlockingSeverity)}\n" +
            $"Blocking finding ids: {FormatBlockingFindingIds(gateResult.BlockingFindingIds)}\n\n" +
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

    private static string FormatOptionalField(string? value, string fieldLabel)
    {
        if (value is null)
        {
            return $"{fieldLabel} was not stored.";
        }

        if (value.Length == 0 || value.Trim().Length == 0)
        {
            return $"{fieldLabel} was stored empty.";
        }

        return value.Trim();
    }

    private static string FormatMinimumBlockingSeverity(int? severity) =>
        severity?.ToString() ?? "Minimum blocking severity was not stored.";

    private static string FormatBlockingFindingIds(IReadOnlyList<string> blockingFindingIds) =>
        blockingFindingIds.Count == 0
            ? "No blocking finding ids were stored on this gate result."
            : string.Join(", ", blockingFindingIds);
}
