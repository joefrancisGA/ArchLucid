using System.Net;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Hosting;

/// <summary>
///     After <see cref="IHostApplicationLifetime.ApplicationStarted" />, issues loopback GETs for cold MVC read paths
///     that otherwise time out the UI proxy on first local-dev navigation (learning plans list, draft intake read).
///     Fail-open; runs once per process (not leader-elected).
/// </summary>
public sealed class ControllerReadPathWarmupHostedService(
    IHttpClientFactory httpClientFactory,
    IHostApplicationLifetime lifetime,
    IOptionsMonitor<ControllerReadPathWarmupOptions> optionsMonitor,
    IServer server,
    ILogger<ControllerReadPathWarmupHostedService> logger) : BackgroundService
{
    public const string HttpClientName = "ControllerReadPathWarmup";

    internal static readonly string[] WarmupRelativePaths =
    [
        "/v1/learning/plans?maxPlans=1",
        "/v1/architecture/draft/00000000-0000-0000-0000-000000000001"
    ];

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IHostApplicationLifetime _lifetime =
        lifetime ?? throw new ArgumentNullException(nameof(lifetime));

    private readonly IOptionsMonitor<ControllerReadPathWarmupOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IServer _server = server ?? throw new ArgumentNullException(nameof(server));

    private readonly ILogger<ControllerReadPathWarmupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        ControllerReadPathWarmupOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
            return;

        try
        {
            await WaitForHostApplicationStartedAsync(_lifetime, stoppingToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            return;
        }

        string baseUrl = ResolveBaseUrl();

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Controller read-path warm-up starting against {BaseUrl} ({PathCount} GET).",
                baseUrl,
                WarmupRelativePaths.Length);
        }

        HttpClient client = _httpClientFactory.CreateClient(HttpClientName);
        int warmed = 0;

        foreach (string relativePath in WarmupRelativePaths)
        {
            if (stoppingToken.IsCancellationRequested)
                break;

            try
            {
                if (await WarmRelativePathAsync(client, baseUrl, relativePath, stoppingToken).ConfigureAwait(false))
                    warmed++;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        ex,
                        "Controller read-path warm-up failed for GET {RelativePath}; continuing fail-open.",
                        relativePath);
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Controller read-path warm-up finished ({WarmedCount}/{PathCount} paths returned an expected status).",
                warmed,
                WarmupRelativePaths.Length);
        }
    }

    internal string ResolveBaseUrl()
    {
        IServerAddressesFeature? addresses = _server.Features.Get<IServerAddressesFeature>();

        if (addresses?.Addresses is { Count: > 0 } set)
        {
            foreach (string address in set)
            {
                string? mapped = TrialFunnelHealthProbe.TryMapToLoopbackBase(address);

                if (!string.IsNullOrEmpty(mapped))
                    return mapped;
            }
        }

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Controller read-path warm-up: no usable Kestrel address; defaulting to http://127.0.0.1:5128.");
        }

        return "http://127.0.0.1:5128";
    }

    internal static bool IsExpectedWarmupStatus(string relativePath, HttpStatusCode statusCode)
    {
        if (relativePath.StartsWith("/v1/learning/plans", StringComparison.OrdinalIgnoreCase))
            return statusCode == HttpStatusCode.OK;

        if (relativePath.StartsWith("/v1/architecture/draft/", StringComparison.OrdinalIgnoreCase))
            return statusCode is HttpStatusCode.OK or HttpStatusCode.NotFound;

        return statusCode == HttpStatusCode.OK;
    }

    private async Task<bool> WarmRelativePathAsync(
        HttpClient client,
        string baseUrl,
        string relativePath,
        CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = new(HttpMethod.Get, new Uri(new Uri(baseUrl, UriKind.Absolute), relativePath));
        ApplyDefaultScopeHeaders(request);

        using HttpResponseMessage response = await client
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);

        if (IsExpectedWarmupStatus(relativePath, response.StatusCode))
            return true;

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Controller read-path warm-up: GET {RelativePath} returned unexpected {StatusCode}.",
                relativePath,
                (int)response.StatusCode);
        }

        return false;
    }

    private static void ApplyDefaultScopeHeaders(HttpRequestMessage request)
    {
        request.Headers.TryAddWithoutValidation("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));
        request.Headers.TryAddWithoutValidation("x-workspace-id", ScopeIds.DefaultWorkspace.ToString("D"));
        request.Headers.TryAddWithoutValidation("x-project-id", ScopeIds.DefaultProject.ToString("D"));
    }

    private static async Task WaitForHostApplicationStartedAsync(
        IHostApplicationLifetime lifetime,
        CancellationToken stoppingToken)
    {
        if (lifetime.ApplicationStarted.IsCancellationRequested)
            return;

        TaskCompletionSource started = new(TaskCreationOptions.RunContinuationsAsynchronously);

        await using (lifetime.ApplicationStarted.Register(static state => ((TaskCompletionSource)state!).TrySetResult(), started))
        {
            await started.Task.WaitAsync(stoppingToken).ConfigureAwait(false);
        }
    }
}
