using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Core.Runs;

namespace ArchLucid.Application;

public sealed partial class RunDetailQueryService
{
    /// <inheritdoc/>
    public async Task<IReadOnlyList<RunSummary>> ListRunSummariesAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<RunRecord> records = await runRepository.ListRecentInScopeAsync(scope, 200, cancellationToken).ConfigureAwait(false);
        return records.Select(r => new RunSummary
        {
            RunId = r.RunId.ToString("N"),
            RequestId = r.ArchitectureRequestId ?? string.Empty,
            Status = r.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            CurrentManifestVersion = r.CurrentManifestVersion,
            SystemName = r.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(r),
            PackageOrigin = r.PackageOrigin,
            GoldenManifestId = r.GoldenManifestId,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(r),
            RowVersion = r.RowVersion
        }).ToList();
    }

    /// <inheritdoc/>
    public async Task<(IReadOnlyList<RunSummary> Items, bool HasMore, string? NextCursor)> ListRunSummariesKeysetAsync(string? cursor, int take,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        DateTime? cursorUtc = null;
        Guid? cursorRunId = null;
        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor);

        if (decoded.HasValue)
        {
            cursorUtc = decoded.Value.CreatedUtc;
            cursorRunId = decoded.Value.RunId;
        }

        RunListPage page = await runRepository.ListRecentInScopeKeysetAsync(scope, cursorUtc, cursorRunId, take, cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RunSummary> items = page.Items.Select(r => new RunSummary
        {
            RunId = r.RunId.ToString("N"),
            RequestId = r.ArchitectureRequestId ?? string.Empty,
            Status = r.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            CurrentManifestVersion = r.CurrentManifestVersion,
            SystemName = r.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(r),
            PackageOrigin = r.PackageOrigin,
            GoldenManifestId = r.GoldenManifestId,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(r),
            RowVersion = r.RowVersion
        }).ToList();
        string? next = null;

        if (!page.HasMore || page.Items.Count <= 0)
            return (items, page.HasMore, next);
        RunRecord last = page.Items[^1];
        next = RunCursorCodec.Encode(last.CreatedUtc, last.RunId);
        return (items, page.HasMore, next);
    }

    /// <inheritdoc/>
    public async Task<(IReadOnlyList<RunSummary> Items, bool HasMore)> ListRunSummariesOffsetAsync(
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunListPage page = await runRepository.ListRecentInScopeOffsetAsync(
            scope,
            RunPagination.NormalizeOffset(offset),
            RunPagination.ClampLimit(limit),
            cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RunSummary> items = page.Items.Select(r => new RunSummary
        {
            RunId = r.RunId.ToString("N"),
            RequestId = r.ArchitectureRequestId ?? string.Empty,
            Status = r.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            CurrentManifestVersion = r.CurrentManifestVersion,
            SystemName = r.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(r),
            PackageOrigin = r.PackageOrigin,
            GoldenManifestId = r.GoldenManifestId,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(r),
            RowVersion = r.RowVersion
        }).ToList();

        return (items, page.HasMore);
    }
}
