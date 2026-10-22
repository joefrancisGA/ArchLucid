namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpRemediationWaveRepository : IRemediationWaveRepository
{
    public Task InsertWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task UpdateWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<RemediationWaveRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<RemediationWaveRecord?>(null);

    public Task<IReadOnlyList<RemediationWaveRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RemediationWaveRecord>>([]);

    public Task InsertMemberAsync(RemediationWaveMemberRecord member, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<IReadOnlyList<RemediationWaveMemberRecord>> ListMembersByWaveAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RemediationWaveMemberRecord>>([]);
}
