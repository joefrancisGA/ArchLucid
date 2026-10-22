using ArchLucid.Application.WeeklyArchitectureDigest;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>
/// One-shot weekly architecture digest (same orchestration slice as <see cref="Hosted.WeeklyArchitectureDigestHostedService"/>).
/// </summary>
public sealed class WeeklyArchitectureDigestArchLucidJob(
    IServiceProvider serviceProvider,
    ILogger<WeeklyArchitectureDigestArchLucidJob> logger) : IArchLucidJob
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<WeeklyArchitectureDigestArchLucidJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.WeeklyArchitectureDigest;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceProvider.CreateScope();
            WeeklyArchitectureDigestJobRunner runner =
                scope.ServiceProvider.GetRequiredService<WeeklyArchitectureDigestJobRunner>();

            await runner.RunOnceEmitLogAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Weekly architecture digest job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
