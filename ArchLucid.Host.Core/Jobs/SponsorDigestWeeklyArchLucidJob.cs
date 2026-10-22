using ArchLucid.Application.SponsorDigest;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>One-shot sponsor digest delivery scan (same body as <see cref="Hosted.SponsorDigestWeeklyHostedService"/> iteration).</summary>
public sealed class SponsorDigestWeeklyArchLucidJob(
    IServiceProvider serviceProvider,
    ILogger<SponsorDigestWeeklyArchLucidJob> logger) : IArchLucidJob
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<SponsorDigestWeeklyArchLucidJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.SponsorDigestWeekly;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceProvider.CreateScope();
            SponsorDigestWeeklyDeliveryScanner scanner =
                scope.ServiceProvider.GetRequiredService<SponsorDigestWeeklyDeliveryScanner>();

            await scanner.PublishDueAsync(TimeProvider.System.GetUtcNow(), cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sponsor digest weekly job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
