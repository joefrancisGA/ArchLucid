using ArchLucid.Core.CustomerSuccess;

namespace ArchLucid.Persistence.CustomerSuccess;

public sealed class InMemoryOperatorStickinessSnapshotReader : IOperatorStickinessSnapshotReader
{
    public Task<OperatorStickinessSignals> GetOperatorSignalsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
        => Task.FromResult(
            new OperatorStickinessSignals(0, 0, null, 0, 0));

    public Task<PilotFunnelSnapshot> GetFunnelSnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
        => Task.FromResult(
            new PilotFunnelSnapshot(null, null, null, null, null, 0, 0, 0));
}
