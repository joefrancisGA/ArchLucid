using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityCrosswalkRepository
{
    Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> InsertManyAsync(
        IReadOnlyList<SecurityCrosswalkMappingRecord> mappings,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> ListBySourceAsync(
        Guid tenantId,
        SecurityCrosswalkEndpointKind sourceEndpointKind,
        string sourceEndpointId,
        CancellationToken cancellationToken = default);
}
