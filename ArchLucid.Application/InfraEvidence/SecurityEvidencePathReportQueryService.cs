using ArchLucid.Contracts.Analysis;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathReportQueryService(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRankRepository rankRepository,
    ISecurityEvidencePathSearchCoverageRepository searchCoverageRepository,
    ISecurityEvidencePathExplanationRepository explanationRepository,
    ISecureNowAnalysisRecoveryJobs? recoveryJobs = null,
    IAnalysisRecoveryRepository? checkpoints = null,
    SecureNowDependencyInputs? dependencyInputs = null,
    IOptionsMonitor<AnalysisStageExecutionOptions>? executionOptions = null,
    TimeProvider? clock = null) : ISecurityEvidencePathReportQueryService
{
    public async Task<SecurityEvidencePathReportResponse?> TryGetReportAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return null;
        }

        AzureInventorySnapshotRecord? snapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null || snapshot.SnapshotId != snapshotId || snapshot.TenantId != scope.TenantId ||
            snapshot.WorkspaceId != scope.WorkspaceId || snapshot.ProjectId != scope.ProjectId)
        {
            return null;
        }

        ProjectSnapshotScopeKey snapshotScope = ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId);

        IReadOnlyList<SecurityEvidencePathRecord> paths =
            await pathRepository.ListBySnapshotAsync(snapshotScope, cancellationToken);

        IReadOnlyList<SecurityEvidencePathHopEdgeTypeReadModel> hopEdgeTypes =
            await pathRepository.ListHopEdgeTypesBySnapshotAsync(snapshotScope, cancellationToken);

        IReadOnlyList<SecurityEvidencePathRankRecord> ranks =
            await rankRepository.ListBySnapshotAsync(snapshotScope, cancellationToken);

        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> searchCoverage =
            await searchCoverageRepository.ListBySnapshotAsync(scope, snapshotId, cancellationToken);

        SecurityEvidencePathReportResponse report = SecurityEvidencePathReportAssembler.Assemble(
            snapshotId,
            paths,
            hopEdgeTypes,
            ranks,
            searchCoverage);

        AnalysisCoverageSummary coverage = await ReadCoverageAsync(scope, snapshot, report, searchCoverage.Count > 0,
            cancellationToken);
        Guid[] pathIds = report.VulnerableAttackPaths.Select(path => path.PathId).Distinct().ToArray();
        IReadOnlyList<SecurityEvidencePathVerificationRecord> observations = pathIds.Length == 0 ? []
            : await explanationRepository.ListLatestVerificationByPathsAsync(scope, snapshotId, pathIds, cancellationToken);
        HashSet<Guid> allowedPathIds = [.. pathIds];

        return new SecurityEvidencePathReportResponse
        {
            SnapshotId = report.SnapshotId,
            AnalysisCoverage = coverage,
            VulnerableAttackPaths = report.VulnerableAttackPaths,
            UnevaluatedGroups = report.UnevaluatedGroups,
            InventoryVerifications = observations
                .Where(row => allowedPathIds.Contains(row.PathId) && BelongsToSnapshot(row, scope, snapshotId))
                .OrderBy(row => row.PathId)
                .Select(row => new SecurityEvidencePathReportVerificationResponse(
                    row.PathId, row.ExplanationId, row.RecordedUtc, row.Verification)).ToList(),
        };
    }

    private async Task<AnalysisCoverageSummary> ReadCoverageAsync(ScopeContext scope, AzureInventorySnapshotRecord snapshot,
        SecurityEvidencePathReportResponse report, bool hasSearchLimits, CancellationToken ct)
    {
        ProjectScopeKey project = ProjectScopeKey.From(scope);
        SecureNowAnalysisRecoveryJob? job = recoveryJobs is null ? null
            : await recoveryJobs.TryGetAsync(project, snapshot.SnapshotId, ct);
        AnalysisRecoveryClaim? claim = job is null || checkpoints is null ? null
            : await checkpoints.ReadAsync(new AnalysisRecoveryStageKey(project, "securenow", snapshot.SnapshotId, "job"), ct);

        string? rejection = null;
        bool verified = false;

        if (job?.Outcome == "succeeded" && claim is { State: "succeeded", ResultReference: { } reference } &&
            claim.InputVersion == job.InputVersion && reference.StartsWith('{') && dependencyInputs is not null)
        {
            rejection = await dependencyInputs.VerifyReportReceiptAsync(scope, snapshot, reference, ct);
            verified = rejection is null;
        }

        bool unranked = report.UnevaluatedGroups.Any(group =>
            group.ReasonCode == SecurityEvidencePathReportReasonCodes.VulnerablePathsUnranked);
        return SecureNowPathAnalysisCoverage.Evaluate(snapshot, job, claim, rejection, verified, hasSearchLimits,
            report.UnevaluatedGroups.Any(group => group.PathIds.Count > 0 &&
                group.ReasonCode != SecurityEvidencePathReportReasonCodes.VulnerablePathsUnranked), unranked, (clock ?? TimeProvider.System).UtcNowDateTime(),
            executionOptions?.CurrentValue.SecureNowReuseMaxAgeHours ?? 24);
    }

    private static bool BelongsToSnapshot(SecurityEvidencePathVerificationRecord row, ScopeContext scope, Guid snapshotId) =>
        row.Verification.Verification is not { } observation ||
        (observation.SnapshotId == snapshotId && observation.Evidence is { } evidence &&
         evidence.TenantId == scope.TenantId && evidence.WorkspaceId == scope.WorkspaceId && evidence.ProjectId == scope.ProjectId);
}
