using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathReportQueryService(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRankRepository rankRepository,
    ISecurityEvidencePathSearchCoverageRepository searchCoverageRepository) : ISecurityEvidencePathReportQueryService
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

        if (snapshot is null)
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

        return SecurityEvidencePathReportAssembler.Assemble(
            snapshotId,
            paths,
            hopEdgeTypes,
            ranks,
            searchCoverage);
    }
}
