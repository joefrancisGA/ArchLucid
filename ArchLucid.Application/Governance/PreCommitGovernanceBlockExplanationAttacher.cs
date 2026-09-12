using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Shared TB-184 explainer wiring for commit 409 responses and finalize readiness blocks.
/// </summary>
public static class PreCommitGovernanceBlockExplanationAttacher
{
    private const int MaxManifestExcerptLength = 4000;

    public static string TruncateManifestExcerpt(string manifestJson)
    {
        if (string.IsNullOrWhiteSpace(manifestJson))
            return string.Empty;

        return manifestJson.Length <= MaxManifestExcerptLength
            ? manifestJson
            : manifestJson[..MaxManifestExcerptLength];
    }

    public static string BuildReadinessGateContextExcerpt(PreCommitGateResult gateResult)
    {
        ArgumentNullException.ThrowIfNull(gateResult);

        return JsonSerializer.Serialize(new
        {
            readinessPath = true,
            reason = gateResult.Reason,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString(),
        });
    }

    public static async Task<string?> TryExplainAsync(
        IPreCommitGovernanceBlockExplainer explainer,
        IOptions<ExplainGovernanceBlocksOptions> explainGovernanceBlocksOptions,
        ILogger logger,
        string runId,
        PreCommitGateResult gateResult,
        string manifestExcerpt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(explainer);
        ArgumentNullException.ThrowIfNull(explainGovernanceBlocksOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(gateResult);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!explainGovernanceBlocksOptions.Value.Enabled)
            return null;

        string truncatedExcerpt = TruncateManifestExcerpt(manifestExcerpt);

        if (truncatedExcerpt.Length == 0)
            return null;

        try
        {
            string? explanation = await explainer
                .ExplainAsync(gateResult, truncatedExcerpt, cancellationToken)
                .ConfigureAwait(false);

            return string.IsNullOrWhiteSpace(explanation) ? null : explanation.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to generate governance block explanation for RunId={RunId}", runId);
            return null;
        }
    }

    public static async Task<PreCommitGateResult> TryAttachToGateResultAsync(
        IPreCommitGovernanceBlockExplainer explainer,
        IOptions<ExplainGovernanceBlocksOptions> explainGovernanceBlocksOptions,
        ILogger logger,
        string runId,
        PreCommitGateResult gateResult,
        string manifestExcerpt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(gateResult);

        string? explanation = await TryExplainAsync(
            explainer,
            explainGovernanceBlocksOptions,
            logger,
            runId,
            gateResult,
            manifestExcerpt,
            cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(explanation))
            return gateResult;

        return new PreCommitGateResult
        {
            Blocked = gateResult.Blocked,
            Reason = gateResult.Reason,
            BlockingFindingIds = gateResult.BlockingFindingIds,
            PolicyPackId = gateResult.PolicyPackId,
            MinimumBlockingSeverity = gateResult.MinimumBlockingSeverity,
            WarnOnly = gateResult.WarnOnly,
            Warnings = gateResult.Warnings,
            BlockExplanation = explanation,
        };
    }
}
