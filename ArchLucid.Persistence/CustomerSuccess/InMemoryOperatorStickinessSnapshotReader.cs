using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.CustomerSuccess;

public sealed class InMemoryOperatorStickinessSnapshotReader : IOperatorStickinessSnapshotReader
{
    // DI parity with SQL reader; in-memory host has no session context to apply.
    public InMemoryOperatorStickinessSnapshotReader(IRlsSessionContextApplicator applicator)
    {
        ArgumentNullException.ThrowIfNull(applicator);
    }

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
