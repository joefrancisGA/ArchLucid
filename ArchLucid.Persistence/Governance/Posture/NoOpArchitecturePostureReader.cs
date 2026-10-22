using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Persistence.Governance.Posture;

/// <summary>In-memory hosts: no SQL posture aggregate; returns an empty read model.</summary>
public sealed class NoOpArchitecturePostureReader : IArchitecturePostureReader
{
    /// <inheritdoc />
    public Task<ArchitecturePostureReadModel> ReadAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ArchitecturePostureReadModel());
}
