using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>Maps a run header to the lightweight list summary.</summary>
public static class RunSummaryProjection
{
    public static RunSummary FromHeader(RunRecord run) =>
        new()
        {
            RunId = run.RunId.ToString("N"),
            RequestId = run.ArchitectureRequestId ?? string.Empty,
            Status = run.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = run.CreatedUtc,
            CompletedUtc = run.CompletedUtc,
            CurrentManifestVersion = run.CurrentManifestVersion,
            SystemName = run.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(run),
            PackageOrigin = run.PackageOrigin,
            GoldenManifestId = run.GoldenManifestId,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run),
            RowVersion = run.RowVersion
        };
}
