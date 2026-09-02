using ArchLucid.Application.Analysis.ReplayComparison;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Thin coordinator that loads run inputs and delegates report assembly to diff slices.
/// </summary>
public sealed class EndToEndReplayComparisonService(
    IRunDetailQueryService runDetailQueryService,
    IRunRepository runRepository,
    IRunExportRecordRepository runExportRecordRepository,
    IScopeContextProvider scopeContextProvider,
    EndToEndReplayComparisonReportComposer reportComposer) : IEndToEndReplayComparisonService
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunExportRecordRepository _runExportRecordRepository =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly EndToEndReplayComparisonReportComposer _reportComposer =
        reportComposer ?? throw new ArgumentNullException(nameof(reportComposer));

    public async Task<EndToEndReplayComparisonReport> BuildAsync(
        string leftRunId,
        string rightRunId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(leftRunId);
        ArgumentNullException.ThrowIfNull(rightRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(leftRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(rightRunId);

        Task<ArchitectureRunDetail> leftDetailTask = LoadRunDetailForRollupOrThrow(leftRunId, cancellationToken);
        Task<ArchitectureRunDetail> rightDetailTask = LoadRunDetailForRollupOrThrow(rightRunId, cancellationToken);
        await Task.WhenAll(leftDetailTask, rightDetailTask);
        ArchitectureRunDetail leftDetail = await leftDetailTask;
        ArchitectureRunDetail rightDetail = await rightDetailTask;
        ArchitectureRun leftRun = leftDetail.Run;
        ArchitectureRun rightRun = rightDetail.Run;
        ReviewRunEngineProvenance? leftEngineProvenance =
            await TryLoadEngineProvenanceAsync(leftRunId, cancellationToken).ConfigureAwait(false);
        ReviewRunEngineProvenance? rightEngineProvenance =
            await TryLoadEngineProvenanceAsync(rightRunId, cancellationToken).ConfigureAwait(false);

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            RunDiff = BuildRunDiff(leftRun, rightRun, leftEngineProvenance, rightEngineProvenance)
        };

        IReadOnlyList<RunExportRecord> leftExports =
            await _runExportRecordRepository.GetByRunIdAsync(leftRunId, cancellationToken);
        IReadOnlyList<RunExportRecord> rightExports =
            await _runExportRecordRepository.GetByRunIdAsync(rightRunId, cancellationToken);

        ReplayComparisonBuildContext context = new()
        {
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            LeftDetail = leftDetail,
            RightDetail = rightDetail,
            LeftEngineProvenance = leftEngineProvenance,
            RightEngineProvenance = rightEngineProvenance,
            LeftExports = leftExports,
            RightExports = rightExports,
            Report = report,
        };

        await _reportComposer.ComposeAsync(context, cancellationToken).ConfigureAwait(false);

        return report;
    }

    private async Task<ReviewRunEngineProvenance?> TryLoadEngineProvenanceAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
        {
            return null;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        return ReviewRunEngineProvenanceJson.TryDeserialize(header?.EngineProvenanceJson);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    private async Task<ArchitectureRunDetail> LoadRunDetailForRollupOrThrow(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail =
            await _runDetailQueryService.GetRunDetailForRollupAsync(runId, cancellationToken);

        return detail ?? throw new RunNotFoundException(runId);
    }

    private static RunMetadataDiffResult BuildRunDiff(
        ArchitectureRun leftRun,
        ArchitectureRun rightRun,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        RunMetadataDiffResult result = new();
        AddIfChanged(result.ChangedFields, "RequestId", leftRun.RequestId, rightRun.RequestId);
        AddIfChanged(result.ChangedFields, "Status", leftRun.Status, rightRun.Status);
        AddIfChanged(result.ChangedFields, "CurrentManifestVersion", leftRun.CurrentManifestVersion, rightRun.CurrentManifestVersion);
        AddIfChanged(result.ChangedFields, "CompletedUtc", leftRun.CompletedUtc, rightRun.CompletedUtc);
        AddIfChanged(result.ChangedFields, "StructuralExecutionMode", leftRun.StructuralExecutionMode, rightRun.StructuralExecutionMode);
        AddIfChanged(
            result.ChangedFields,
            "ModelAliasId",
            leftEngineProvenance?.ModelAliasId,
            rightEngineProvenance?.ModelAliasId);
        result.RequestIdsDiffer = !string.Equals(leftRun.RequestId, rightRun.RequestId, StringComparison.OrdinalIgnoreCase);
        result.ManifestVersionsDiffer = !string.Equals(leftRun.CurrentManifestVersion, rightRun.CurrentManifestVersion, StringComparison.OrdinalIgnoreCase);
        result.StatusDiffers = !Equals(leftRun.Status, rightRun.Status);
        result.CompletionStateDiffers = !EqualityComparer<DateTime?>.Default.Equals(leftRun.CompletedUtc, rightRun.CompletedUtc);
        result.ExecutionModesDiffer = leftRun.StructuralExecutionMode != rightRun.StructuralExecutionMode;
        result.ModelAliasIdsDiffer = !string.Equals(
            leftEngineProvenance?.ModelAliasId,
            rightEngineProvenance?.ModelAliasId,
            StringComparison.OrdinalIgnoreCase);
        result.SharedNonRealExecutionMode =
            !result.ExecutionModesDiffer
            && leftRun.StructuralExecutionMode != StructuralExecutionMode.Real;
        return result;
    }

    private static void AddIfChanged<T>(List<string> target, string fieldName, T left, T right)
    {
        if (!EqualityComparer<T>.Default.Equals(left, right))
            target.Add(fieldName);
    }
}
