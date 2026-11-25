using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathReportQueryService(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRankRepository rankRepository,
    ISecurityEvidencePathSearchCoverageRepository searchCoverageRepository,
    ISecurityEvidencePathExplanationRepository explanationRepository) : ISecurityEvidencePathReportQueryService
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

        Guid[] pathIds = report.VulnerableAttackPaths.Select(path => path.PathId).Distinct().ToArray();
        if (pathIds.Length == 0)
            return report;

        IReadOnlyList<SecurityEvidencePathVerificationRecord> observations =
            await explanationRepository.ListLatestVerificationByPathsAsync(scope, snapshotId, pathIds, cancellationToken);
        HashSet<Guid> allowedPathIds = [.. pathIds];
        return new SecurityEvidencePathReportResponse
        {
            SnapshotId = report.SnapshotId,
            VulnerableAttackPaths = report.VulnerableAttackPaths,
            UnevaluatedGroups = report.UnevaluatedGroups,
            InventoryVerifications = observations
                .Where(row => allowedPathIds.Contains(row.PathId) && BelongsToSnapshot(row, scope, snapshotId))
                .OrderBy(row => row.PathId)
                .Select(row => new SecurityEvidencePathReportVerificationResponse(
                    row.PathId, row.ExplanationId, row.RecordedUtc, row.Verification)).ToList(),
        };
    }

    private static bool BelongsToSnapshot(SecurityEvidencePathVerificationRecord row, ScopeContext scope, Guid snapshotId) =>
        row.Verification.Verification is not { } observation ||
        (observation.SnapshotId == snapshotId && observation.Evidence is { } evidence &&
         evidence.TenantId == scope.TenantId && evidence.WorkspaceId == scope.WorkspaceId && evidence.ProjectId == scope.ProjectId);
}
