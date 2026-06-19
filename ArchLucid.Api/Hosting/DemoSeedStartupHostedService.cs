using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Hosting;

/// <summary>
///     Applies the Contoso demo seed once at startup when <c>Demo:AnonymousViewer:Enabled</c> is true so
///     <c>GET /v1/demo/explain</c> is populated on freshly deployed demo hosts without a manual
///     <c>POST /v1/demo/seed</c>. Work runs on a background thread so host startup is not blocked.
/// </summary>
public sealed class DemoSeedStartupHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<DemoOptions> demoOptions,
    ILogger<DemoSeedStartupHostedService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptions<DemoOptions> _demoOptions =
        demoOptions ?? throw new ArgumentNullException(nameof(demoOptions));

    private readonly ILogger<DemoSeedStartupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        DemoSeedStartupWork.RunAsync(_scopeFactory, _demoOptions.Value, _logger, stoppingToken);
}
