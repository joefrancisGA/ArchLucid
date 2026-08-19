using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Hosting;

/// <summary>
///     Daily scan for SAML SP signing certificate expiry on hosts that load API web-layer diagnostics; emails tenant
///     admins resolved via <see cref="ITenantTrialEmailContactLookup"/>. Uses <see cref="ISamlOperationalDiagnosticsService"/>
///     only (does not touch SAML login). Leader-elected so scaled-out API replicas do not multiply sends.
/// </summary>
public sealed class SamlCertExpiryNotificationHostedService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<SamlCertExpiryNotificationHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<SamlCertExpiryNotificationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.SamlCertExpiryNotification,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = _scopeFactory.CreateScope();

                await SamlCertExpiryNotificationWork.RunDailyPassAsync(
                        scope.ServiceProvider.GetRequiredService<ISamlOperationalDiagnosticsService>(),
                        scope.ServiceProvider.GetRequiredService<ITenantRepository>(),
                        scope.ServiceProvider.GetRequiredService<ITenantTrialEmailContactLookup>(),
                        scope.ServiceProvider.GetRequiredService<ISentEmailLedger>(),
                        scope.ServiceProvider.GetRequiredService<IEmailProvider>(),
                        scope.ServiceProvider.GetRequiredService<IOptionsMonitor<EmailNotificationOptions>>(),
                        _timeProvider,
                        _logger,
                        leaderToken)
                    .ConfigureAwait(false);
            }
            catch (OperationCanceledException)when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)when (!leaderToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "SAML signing certificate expiry notification iteration failed.");
            }

            try
            {
                await Task.Delay(SamlCertExpiryNotificationWork.DailyInterval, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
