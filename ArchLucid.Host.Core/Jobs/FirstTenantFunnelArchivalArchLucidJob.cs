using ArchLucid.Core.Configuration;

using ArchLucid.Host.Core.Hosted;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>One FirstTenantFunnel cold-archive pass (same work as <see cref="FirstTenantFunnelArchivalHostedService"/>).</summary>
public sealed class FirstTenantFunnelArchivalArchLucidJob(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<FirstTenantFunnelOptions> funnelOptions,
    ILogger<FirstTenantFunnelArchivalArchLucidJob> logger) : IArchLucidJob
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<FirstTenantFunnelOptions> _funnelOptions =
        funnelOptions ?? throw new ArgumentNullException(nameof(funnelOptions));

    private readonly ILogger<FirstTenantFunnelArchivalArchLucidJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.FirstTenantFunnelArchival;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            await FirstTenantFunnelArchivalIteration.RunOnceAsync(
                    _scopeFactory,
                    _funnelOptions.CurrentValue,
                    _logger,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FirstTenantFunnel archival job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
