using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationWaveRepository
{
    Task InsertWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default);

    Task UpdateWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default);

    Task<RemediationWaveRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationWaveRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task InsertMemberAsync(RemediationWaveMemberRecord member, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationWaveMemberRecord>> ListMembersByWaveAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default);
}
