using ArchLucid.Host.Core.Audit;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>One-shot Required audit trail orphan probe (same work as one hosted-service iteration).</summary>
public sealed class RequiredAuditTrailOrphanProbeArchLucidJob(
    IRequiredAuditTrailOrphanProbeExecutor executor,
    ILogger<RequiredAuditTrailOrphanProbeArchLucidJob> logger) : IArchLucidJob
{
    private readonly IRequiredAuditTrailOrphanProbeExecutor _executor =
        executor ?? throw new ArgumentNullException(nameof(executor));

    private readonly ILogger<RequiredAuditTrailOrphanProbeArchLucidJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.RequiredAuditTrailOrphanProbe;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _executor.RunOnceAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Required audit trail orphan probe job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
