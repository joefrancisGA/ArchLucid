namespace ArchLucid.Core.CustomerSuccess;

/// <summary>Reads scope-scoped stickiness inputs for operator guidance (SQL-backed in production).</summary>
public interface IOperatorStickinessSnapshotReader
{
    Task<OperatorStickinessSignals> GetOperatorSignalsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken);

    Task<PilotFunnelSnapshot> GetFunnelSnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken);
}
