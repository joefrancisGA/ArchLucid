using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <inheritdoc cref="IAuthorityCommitGovernanceStage" />
public sealed class AuthorityCommitGovernanceStage(
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IPreCommitGovernanceBlockExplainer preCommitGovernanceBlockExplainer,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IOptions<ExplainGovernanceBlocksOptions> explainGovernanceBlocksOptions,
    ILogger<AuthorityCommitGovernanceStage> logger) : IAuthorityCommitGovernanceStage
{
    private readonly IPreCommitGovernanceGate _preCommitGovernanceGate =
        preCommitGovernanceGate ?? throw new ArgumentNullException(nameof(preCommitGovernanceGate));

    private readonly IPreCommitGovernanceBlockExplainer _preCommitGovernanceBlockExplainer =
        preCommitGovernanceBlockExplainer ?? throw new ArgumentNullException(nameof(preCommitGovernanceBlockExplainer));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptions<ExplainGovernanceBlocksOptions> _explainGovernanceBlocksOptions =
        explainGovernanceBlocksOptions ?? throw new ArgumentNullException(nameof(explainGovernanceBlocksOptions));

    private readonly ILogger<AuthorityCommitGovernanceStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task EvaluateOrThrowAsync(
        string runId,
        string actor,
        string goldenManifestWireJson,
        string? governanceBypassJustification,
        PreCommitGovernancePreloadedData? preloadedData,
        CancellationToken cancellationToken)
    {
        PreCommitGateResult gateResult = await _preCommitGovernanceGate.EvaluateAsync(
            runId,
            goldenManifestWireJson,
            preloadedData,
            cancellationToken);

        if (gateResult.WarnOnly)
        {
            await EmitPreCommitWarnedAuditAsync(gateResult, runId, actor, cancellationToken);
            return;
        }

        if (!gateResult.Blocked)
            return;

        if (!string.IsNullOrEmpty(governanceBypassJustification))
        {
            await EmitGovernanceBypassInvokedAuditAsync(gateResult, runId, actor, governanceBypassJustification, cancellationToken);

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Pre-commit governance gate bypassed with operator justification — RunId={RunId}",
                    LogSanitizer.Sanitize(runId));
            }

            return;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            reason = gateResult.Reason,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString()
        });
        AuditEvent preCommitBlocked = scope.CreateAuditEvent(
            AuditEventTypes.GovernancePreCommitBlocked,
            actor,
            actor,
            dataJson);
        preCommitBlocked.RunId = runGuid;

        await _auditService.LogAsync(preCommitBlocked, cancellationToken);
        PreCommitGateResult resultWithExplanation = await TryAttachGovernanceBlockExplanationAsync(
            runId,
            gateResult,
            goldenManifestWireJson,
            cancellationToken);
        throw new PreCommitGovernanceBlockedException(resultWithExplanation);
    }

    internal static string? NormalizeGovernanceBypassJustification(string? raw)
    {
        if (raw is null)
            return null;

        string trimmed = raw.Trim();

        if (trimmed.Length == 0)
            return null;

        const int maxLen = 4000;

        if (trimmed.Length <= maxLen)
            return trimmed;

        return trimmed[..maxLen];
    }

    private async Task<PreCommitGateResult> TryAttachGovernanceBlockExplanationAsync(
        string runId,
        PreCommitGateResult gateResult,
        string goldenManifestWireJson,
        CancellationToken cancellationToken)
    {
        if (!_explainGovernanceBlocksOptions.Value.Enabled)
            return gateResult;

        string manifestExcerpt = TruncateForGovernanceExplanation(goldenManifestWireJson);

        if (manifestExcerpt.Length == 0)
            return gateResult;

        try
        {
            string? explanation = await _preCommitGovernanceBlockExplainer.ExplainAsync(gateResult, manifestExcerpt, cancellationToken);

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
                BlockExplanation = explanation
            };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Failed to generate governance block explanation for RunId={RunId}", runId);
            return gateResult;
        }
    }

    private static string TruncateForGovernanceExplanation(string manifestJson)
    {
        if (string.IsNullOrWhiteSpace(manifestJson))
            return string.Empty;

        const int maxLength = 4000;
        return manifestJson.Length <= maxLength
            ? manifestJson
            : manifestJson[..maxLength];
    }

    private async Task EmitGovernanceBypassInvokedAuditAsync(
        PreCommitGateResult gateResult,
        string runId,
        string actor,
        string justification,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            justification,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString(),
            gateReason = gateResult.Reason
        });
        AuditEvent bypass = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceBypassInvoked,
            actor,
            actor,
            dataJson);
        bypass.RunId = runGuid;

        await _auditService.LogAsync(bypass, cancellationToken);
    }

    private async Task EmitPreCommitWarnedAuditAsync(
        PreCommitGateResult gateResult,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? runGuid = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            reason = gateResult.Reason,
            warnings = gateResult.Warnings,
            blockingFindingIds = gateResult.BlockingFindingIds,
            policyPackId = gateResult.PolicyPackId,
            minimumBlockingSeverity = gateResult.MinimumBlockingSeverity?.ToString()
        });
        AuditEvent preCommitWarned = scope.CreateAuditEvent(
            AuditEventTypes.GovernancePreCommitWarned,
            actor,
            actor,
            dataJson);
        preCommitWarned.RunId = runGuid;

        await _auditService.LogAsync(preCommitWarned, cancellationToken);

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning(
                "Pre-commit governance gate warned (not blocked) — authority path: RunId={RunId}, Reason={Reason}",
                LogSanitizer.Sanitize(runId),
                LogSanitizer.Sanitize(gateResult.Reason ?? string.Empty));
    }
}
