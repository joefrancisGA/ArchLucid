using ArchLucid.Application.Governance;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>One compliance drift escalation scan (same body as <see cref="Hosted.ComplianceDriftEscalationHostedService"/> iteration).</summary>
public sealed class ComplianceDriftEscalationArchLucidJob(
    IServiceProvider serviceProvider,
    ILogger<ComplianceDriftEscalationArchLucidJob> logger) : IArchLucidJob
{
    private readonly ILogger<ComplianceDriftEscalationArchLucidJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.ComplianceDriftEscalation;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceProvider.CreateScope();
            ComplianceDriftEscalationScanner scanner =
                scope.ServiceProvider.GetRequiredService<ComplianceDriftEscalationScanner>();

            await scanner.ScanDueAsync(TimeProvider.System.GetUtcNow(), cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compliance drift escalation scan job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
