using ArchLucid.Core.Diagnostics;

using ArchLucid.Host.Core.Configuration;

using ArchLucid.Host.Core.Diagnostics;



using Microsoft.Extensions.Hosting;

using Microsoft.Extensions.Logging;



namespace ArchLucid.Host.Core.Hosted;



/// <summary>

///     Probes generic OIDC authority metadata at startup when <c>ArchLucidAuth:Mode=JwtBearer</c> (Improvement #7).

/// </summary>

public sealed class OidcAuthorityStartupProbeHostedService(

    IConfiguration configuration,

    IHttpClientFactory httpClientFactory,

    IHostApplicationLifetime hostApplicationLifetime,

    ILogger<OidcAuthorityStartupProbeHostedService> logger) : IHostedService

{

    private readonly IConfiguration _configuration =

        configuration ?? throw new ArgumentNullException(nameof(configuration));



    private readonly IHttpClientFactory _httpClientFactory =

        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));



    private readonly IHostApplicationLifetime _hostApplicationLifetime =

        hostApplicationLifetime ?? throw new ArgumentNullException(nameof(hostApplicationLifetime));



    private readonly ILogger<OidcAuthorityStartupProbeHostedService> _logger =

        logger ?? throw new ArgumentNullException(nameof(logger));



    /// <inheritdoc />

    public async Task StartAsync(CancellationToken cancellationToken)

    {

        HttpClient client = _httpClientFactory.CreateClient(nameof(ConfigurationHealthProbe));

        OidcAuthorityMetadataProbe.ProbeResult result =

            await OidcAuthorityMetadataProbe.ProbeAsync(_configuration, client, cancellationToken).ConfigureAwait(false);



        if (!result.IsApplicable)

            return;



        if (result.Succeeded)

        {

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation("OIDC authority startup probe succeeded: {Detail}", result.Detail);



            return;

        }



        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning("OIDC authority startup probe failed: {Detail}", result.Detail);



        ArchLucidInstrumentation.RecordStartupConfigWarning(StartupValidationWarningRuleNames.OidcAuthorityUnreachable);



        if (ShouldFailClosedOnOidcDiscoveryError())

        {

            if (_logger.IsEnabled(LogLevel.Critical))

            {

                _logger.LogCritical(

                    "ArchLucidAuth:FailClosedOnOidcDiscoveryError is enabled — stopping the host because OIDC discovery failed.");

            }



            _hostApplicationLifetime.StopApplication();

        }

    }



    private bool ShouldFailClosedOnOidcDiscoveryError() =>

        _configuration.GetValue("ArchLucidAuth:FailClosedOnOidcDiscoveryError", false);



    /// <inheritdoc />

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

}

