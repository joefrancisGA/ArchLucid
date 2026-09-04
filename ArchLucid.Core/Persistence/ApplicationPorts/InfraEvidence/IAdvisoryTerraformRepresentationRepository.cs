using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAdvisoryTerraformRepresentationRepository
{
    Task<IReadOnlyList<AdvisoryTerraformResourceMappingRecord>> ListMappingsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task ReplaceMappingsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings,
        CancellationToken cancellationToken = default);
}
