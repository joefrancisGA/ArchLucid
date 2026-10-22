using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAdvisoryTerraformRepresentationRepository
{
    Task<IReadOnlyList<AdvisoryTerraformResourceMappingRecord>> ListMappingsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    async Task<AdvisoryTerraformResourceMappingRecord?> TryGetMappingByCloudResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings =
            await ListMappingsBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        return mappings.FirstOrDefault(row => row.CloudResourceId == cloudResourceId);
    }

    Task ReplaceMappingsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings,
        CancellationToken cancellationToken = default);
}
