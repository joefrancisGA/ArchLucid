using ArchLucid.Application.Explanation;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Exports;

public sealed partial class ArchitectureReviewExportService
{
    private async Task EnsureSealedDecisionReceiptVerifiedOrThrowAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
            runGuid,
            runId,
            _authorityQueryService,
            _manifestHashService,
            scope,
            cancellationToken);
    }

    private async Task<string?> ResolveActiveTrialExportNoticeAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return ActiveTrialExportNoticeFormatter.Format(tenant);
    }

    private async Task<string?> ResolveTenantDisplayNameAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null || string.IsNullOrWhiteSpace(tenant.Name))
            return null;

        return tenant.Name.Trim();
    }

    private async Task<string?> TryBuildExplanationConfidenceCalloutAsync(
        ArchitectureRunDetail detail,
        CancellationToken cancellationToken)
    {
        string runId = detail.Run.RunId ?? string.Empty;

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunExplanationSummary? summary = await runExplanationSummaryService
                .GetSummaryAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            if (summary is null)
                return null;

            RunExplanationConfidenceSignals signals = RunExplanationConfidenceCalloutBuilder.FromSummary(summary);

            return RunExplanationConfidenceCalloutBuilder.BuildExportCallout(signals);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        runGuid = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runId))
            return false;

        if (Guid.TryParse(runId, out runGuid))
            return true;

        if (runId.Length >= 32 && Guid.TryParseExact(runId[..32], "N", out runGuid))
            return true;

        return false;
    }

    private static string SanitizeRunIdForFileName(string runId)
    {
        string trimmed = runId.Trim();

        if (trimmed.Length == 0)
            return "run";

        foreach (char c in Path.GetInvalidFileNameChars())
            trimmed = trimmed.Replace(c, '_');

        return trimmed.Length <= 120 ? trimmed : trimmed[..120];
    }
}
