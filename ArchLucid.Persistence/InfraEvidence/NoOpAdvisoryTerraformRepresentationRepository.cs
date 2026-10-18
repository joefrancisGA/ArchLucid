using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAdvisoryTerraformRepresentationRepository : IAdvisoryTerraformRepresentationRepository
{
    public Task<IReadOnlyList<AdvisoryTerraformResourceMappingRecord>> ListMappingsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AdvisoryTerraformResourceMappingRecord>>([]);

    public Task<AdvisoryTerraformResourceMappingRecord?> TryGetMappingByCloudResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AdvisoryTerraformResourceMappingRecord?>(null);

    public Task ReplaceMappingsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
