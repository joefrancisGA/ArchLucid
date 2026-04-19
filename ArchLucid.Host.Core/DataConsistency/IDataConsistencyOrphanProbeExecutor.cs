namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>One orphan probe pass (see <see cref="DataConsistencyOrphanProbeExecutor"/>).</summary>
public interface IDataConsistencyOrphanProbeExecutor
{
    Task RunOnceAsync(CancellationToken cancellationToken);
}
