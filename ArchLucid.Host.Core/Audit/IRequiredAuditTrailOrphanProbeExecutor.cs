namespace ArchLucid.Host.Core.Audit;

/// <summary>One-shot Required audit trail orphan probe (TB-955).</summary>
public interface IRequiredAuditTrailOrphanProbeExecutor
{
    Task RunOnceAsync(CancellationToken cancellationToken);
}
