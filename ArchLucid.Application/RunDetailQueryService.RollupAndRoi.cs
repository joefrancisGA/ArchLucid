using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

public sealed partial class RunDetailQueryService
{
    /// <inheritdoc/>
    public async Task<ArchitectureRunDetail?> GetRunDetailForRollupAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!TryParseRunGuid(runId, out Guid runGuid))
        {
            if (logger.IsEnabled(LogLevel.Debug))
                logger.LogDebug("RunDetailQueryService: run '{RunId}' is not a valid run identifier.", LogSanitizer.Sanitize(runId));

            return null;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? record = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (record is null)
        {
            if (logger.IsEnabled(LogLevel.Debug))
                logger.LogDebug("RunDetailQueryService: run '{RunId}' not found.", LogSanitizer.Sanitize(runId));

            return null;
        }

        Task<IReadOnlyList<AgentResult>> resultsTask =
            resultRepository.GetRollupProjectionByRunIdAsync(scope, runId, cancellationToken);
        Task<GoldenManifest?> manifestTask =
            unifiedGoldenManifestReader.ReadByRunIdAsync(scope, runGuid, cancellationToken);

        await Task.WhenAll(resultsTask, manifestTask).ConfigureAwait(false);

        List<AgentResult> results = (await resultsTask.ConfigureAwait(false)).ToList();
        List<string> taskIds = results
            .Select(static result => result.TaskId)
            .Where(static taskId => !string.IsNullOrWhiteSpace(taskId))
            .Distinct(StringComparer.Ordinal)
            .ToList();
        ArchitectureRun run = RunRecordToArchitectureRunMapper.ToArchitectureRun(record, taskIds);
        GoldenManifest? manifest = await manifestTask.ConfigureAwait(false);

        return new ArchitectureRunDetail
        {
            Run = run,
            Results = results,
            Manifest = manifest,
            HasBrokenManifestReference = !string.IsNullOrWhiteSpace(run.CurrentManifestVersion) && manifest is null
        };
    }

    /// <inheritdoc/>
    public async Task<ArchitectureRunDetail?> GetRunDetailForRoiAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArchitectureRunDetail? detail = await GetRunDetailForRollupAsync(runId, cancellationToken).ConfigureAwait(false);

        if (detail is null)
            return null;

        if (detail.Run.FindingsSnapshotId is not { } findingsSnapshotId)
            return detail;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyDictionary<string, FindingMuteFlag> muteFlags =
            await findingRecordMuteRepository.GetMuteFlagsAsync(findingsSnapshotId, scope, cancellationToken)
                .ConfigureAwait(false);

        if (muteFlags.Count > 0)
            FindingMuteFlagApplier.Apply(detail.Results, muteFlags);

        return detail;
    }
}
