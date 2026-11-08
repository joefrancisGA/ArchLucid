using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-22 suggestion 212: comparison verify/regenerate fail-closed on sealed <see cref="ManifestDocument.ManifestHash"/> drift.</summary>
internal static class ComparisonReplayManifestHashGuard
{
    public static Task EnsureDriftAnalyzeSealedManifestHashesOrThrowAsync(
        ComparisonRecord record,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        IScopeContextProvider scopeContextProvider,
        IRunExportRecordRepository runExportRecordRepository,
        CancellationToken cancellationToken) =>
        EnsureReplaySealedManifestHashesOrThrowAsync(
            record,
            ComparisonReplayMode.Regenerate,
            authorityQueryService,
            manifestHashService,
            scopeContextProvider,
            runExportRecordRepository,
            cancellationToken);

    public static async Task EnsureReplaySealedManifestHashesOrThrowAsync(
        ComparisonRecord record,
        ComparisonReplayMode mode,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        IScopeContextProvider scopeContextProvider,
        IRunExportRecordRepository runExportRecordRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(runExportRecordRepository);

        if (mode is not ComparisonReplayMode.Verify and not ComparisonReplayMode.Regenerate)
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string? comparisonType =
            ComparisonRecordScopedReadNormalizer.CanonicalizeComparisonTypeSearchFilter(record.ComparisonType);

        if (string.Equals(comparisonType, ComparisonTypes.EndToEndReplay, StringComparison.Ordinal))
        {
            await EnsureRunPairSealedManifestHashesOrThrowAsync(
                record.LeftRunId,
                record.RightRunId,
                authorityQueryService,
                manifestHashService,
                scope,
                cancellationToken);

            return;
        }

        if (!string.Equals(comparisonType, ComparisonTypes.ExportRecordDiff, StringComparison.Ordinal))
            return;

        if (string.IsNullOrWhiteSpace(record.LeftExportRecordId) || string.IsNullOrWhiteSpace(record.RightExportRecordId))
        {
            throw new ConflictException(
                $"Comparison replay blocked for '{record.ComparisonRecordId}': export-diff record is missing export record ids.");
        }

        string leftExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(record.LeftExportRecordId);
        string rightExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(record.RightExportRecordId);
        RunExportRecord left = await runExportRecordRepository.GetByIdAsync(leftExportRecordId, cancellationToken)
                               ?? throw new InvalidOperationException($"Export record '{leftExportRecordId}' was not found.");
        RunExportRecord right = await runExportRecordRepository.GetByIdAsync(rightExportRecordId, cancellationToken)
                                ?? throw new InvalidOperationException($"Export record '{rightExportRecordId}' was not found.");

        left.RunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(left.RunId);
        right.RunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(right.RunId);

        await EnsureRunSealedManifestHashOrThrowAsync(left.RunId, authorityQueryService, manifestHashService, scope, cancellationToken);
        await EnsureRunSealedManifestHashOrThrowAsync(right.RunId, authorityQueryService, manifestHashService, scope, cancellationToken);
    }

    private static async Task EnsureRunPairSealedManifestHashesOrThrowAsync(
        string? leftRunId,
        string? rightRunId,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(leftRunId) || string.IsNullOrWhiteSpace(rightRunId))
        {
            throw new ConflictException(
                "Comparison replay blocked: end-to-end record is missing LeftRunId/RightRunId required for sealed manifest hash verification.");
        }

        string leftLookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(leftRunId);
        string rightLookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(rightRunId);

        await EnsureRunSealedManifestHashOrThrowAsync(leftLookupRunId, authorityQueryService, manifestHashService, scope, cancellationToken);
        await EnsureRunSealedManifestHashOrThrowAsync(rightLookupRunId, authorityQueryService, manifestHashService, scope, cancellationToken);
    }

    private static async Task EnsureRunSealedManifestHashOrThrowAsync(
        string runId,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ConflictException($"Comparison replay blocked: run id '{runId}' is not a valid GUID.");

        RunDetailDto? detail = await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runGuid, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new ConflictException(
                $"Comparison replay blocked: run '{runId}' has no committed golden manifest available for sealed manifest hash verification.");
        }

        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            runId,
            manifestHashService);
    }
}
