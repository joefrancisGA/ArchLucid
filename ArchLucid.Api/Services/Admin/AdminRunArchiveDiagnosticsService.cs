using System.Data.Common;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

using MissingArchitectureRequestAutoRemediationOptions =
    ArchLucid.Application.DataConsistency.MissingArchitectureRequestAutoRemediationOptions;


namespace ArchLucid.Api.Services.Admin;

public interface IAdminRunArchiveDiagnosticsService
{
    Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset createdBeforeUtc, CancellationToken cancellationToken = default);
    Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken cancellationToken = default);
}

public sealed class AdminRunArchiveDiagnosticsService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAdminRunArchiveAuditLogger archiveAuditLogger) : IAdminRunArchiveDiagnosticsService
{
    private readonly IAdminRunArchiveAuditLogger _archiveAuditLogger =
        archiveAuditLogger ?? throw new ArgumentNullException(nameof(archiveAuditLogger));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(
    DateTimeOffset createdBeforeUtc,
    CancellationToken cancellationToken = default)
{
    ScopeContext scope = _scopeContextProvider.GetCurrentScope();
    RunArchiveBatchResult result =
        await _runRepository.ArchiveRunsCreatedBeforeForScopeAsync(scope, createdBeforeUtc, cancellationToken)
            .ConfigureAwait(false);

    if (result.UpdatedCount > 0)

        await _archiveAuditLogger.LogManifestArchivedBatchAsync(
            $"createdBefore:{createdBeforeUtc.UtcDateTime:o}",
            result.ArchivedRuns.Count,
            result.ArchivedRuns.Select(static r => r.RunId.ToString("D")).ToList(),
            result.ChildCascade,
            cancellationToken);

    return result;
}

/// <inheritdoc />
public async Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(
    IReadOnlyList<Guid> runIds,
    CancellationToken cancellationToken = default)
{
    ScopeContext scope = _scopeContextProvider.GetCurrentScope();
    List<Guid> scopedRunIds = [];
    List<RunArchiveByIdFailure> outOfScopeFailures = [];

    foreach (Guid runId in runIds.Distinct())
    {
        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
        {
            outOfScopeFailures.Add(new RunArchiveByIdFailure(runId, "Run not found."));
            continue;
        }

        scopedRunIds.Add(runId);
    }

    if (scopedRunIds.Count == 0)
    {
        return new RunArchiveByIdsResult { Failed = outOfScopeFailures };
    }

    RunArchiveByIdsResult result = await _runRepository
        .ArchiveRunsByIdsAsync(scopedRunIds, cancellationToken)
        .ConfigureAwait(false);

    if (outOfScopeFailures.Count > 0)
    {
        List<RunArchiveByIdFailure> mergedFailures = [..result.Failed, ..outOfScopeFailures];
        result = new RunArchiveByIdsResult
        {
            SucceededRunIds = result.SucceededRunIds,
            ArchivedRuns = result.ArchivedRuns,
            Failed = mergedFailures,
            ChildCascade = result.ChildCascade
        };
    }

    if (result.SucceededRunIds.Count > 0)

        await _archiveAuditLogger.LogManifestArchivedBatchAsync(
            "byIds",
            result.SucceededRunIds.Count,
            result.SucceededRunIds.Select(static r => r.ToString("D")).ToList(),
            result.ChildCascade,
            cancellationToken);

    return result;
}
}
