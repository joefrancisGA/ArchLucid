using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityCrosswalkRepository : ISecurityCrosswalkRepository
{
    public Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> InsertManyAsync(
        IReadOnlyList<SecurityCrosswalkMappingRecord> mappings,
        CancellationToken cancellationToken = default)
        => Task.FromResult(mappings);

    public Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> ListBySourceAsync(
        Guid tenantId,
        SecurityCrosswalkEndpointKind sourceEndpointKind,
        string sourceEndpointId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SecurityCrosswalkMappingRecord>>([]);
}
