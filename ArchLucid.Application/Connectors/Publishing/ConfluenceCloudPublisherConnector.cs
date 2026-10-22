using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integrations.Itsm;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Connectors.Publishing;

/// <summary>Minimal Confluence Cloud REST create-page publisher (storage HTML body).</summary>
public sealed class ConfluenceCloudPublisherConnector : IPublisherConnector
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;
    private readonly IOptionsMonitor<ConfluencePublishingOptions> _options;
    private readonly IConfluencePublishingHttpAuthenticator _authenticator;
    private readonly ILogger<ConfluenceCloudPublisherConnector> _logger;

    public ConfluenceCloudPublisherConnector(
        HttpClient http,
        IOptionsMonitor<ConfluencePublishingOptions> options,
        IConfluencePublishingHttpAuthenticator authenticator,
        ILogger<ConfluenceCloudPublisherConnector> logger)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(authenticator);
        ArgumentNullException.ThrowIfNull(logger);
        _http = http ?? throw new ArgumentNullException(nameof(http));
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _authenticator = authenticator ?? throw new ArgumentNullException(nameof(authenticator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public PublishingTargetKind Kind => PublishingTargetKind.ConfluenceCloud;

    public async Task<PublishOutcome> PublishDocumentAsync(PublishRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ConfluencePublishingOptions o = _options.CurrentValue;
        if (!o.Enabled)
            return new PublishOutcome(false, null, ConfluencePublishFailureReason.BadResponse, "Confluence publishing is disabled in configuration.");
        string spaceKey = ConfluencePublishingSpaceKeyResolver.Resolve(o, request.ProjectId).Trim();
        if (spaceKey.Length is 0)
            return new PublishOutcome(false, null, ConfluencePublishFailureReason.BadResponse,
                "Confluence space key is not configured for this project (Integrations:ConfluencePublishing:SpaceKey or ProjectSpaceKeys).");

        string cloudBaseUrl = o.CloudBaseUrl.Trim().TrimEnd('/');

        if (cloudBaseUrl.Length is 0)
        {
            return new PublishOutcome(false, null, ConfluencePublishFailureReason.BadResponse,
                "Confluence CloudBaseUrl is not configured.");
        }

        AuthenticationHeaderValue? authorization =
            await _authenticator.TryCreateAuthorizationHeaderAsync(cancellationToken).ConfigureAwait(false);

        if (authorization is null)
        {
            return new PublishOutcome(false, null, ConfluencePublishFailureReason.Unauthorized,
                DescribeMissingCredentials(o));
        }

        string html = BuildStorageHtml(request.PayloadJson);
        object body = new
        {
            type = "page",
            title = request.PageTitle,
            space = new
            {
                key = spaceKey
            },
            body = new
            {
                storage = new
                {
                    value = html,
                    representation = "storage"
                }
            }
        };

        Uri postUri = new($"{cloudBaseUrl}/wiki/rest/api/content");
        using HttpRequestMessage httpRequest = new(HttpMethod.Post, postUri);
        httpRequest.Headers.Authorization = authorization;
        httpRequest.Content = JsonContent.Create(body, options: SerializerOptions);

        using HttpResponseMessage response =
            await _http.SendAsync(httpRequest, cancellationToken).ConfigureAwait(false);

        if (response.IsSuccessStatusCode)
        {
            ConfluenceCreateResponse? created = await response.Content.ReadFromJsonAsync<ConfluenceCreateResponse>(SerializerOptions, cancellationToken)
                .ConfigureAwait(false);
            string? id = created?.Id;
            return string.IsNullOrWhiteSpace(id) ? new PublishOutcome(false, null, ConfluencePublishFailureReason.BadResponse, "Confluence returned success but no page id.") : new PublishOutcome(true, id, null, null);
        }

        ConfluencePublishFailureReason reason = MapFailure(response.StatusCode);
        string detail = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("Confluence publish failed: {Status} {Body}", response.StatusCode, LogSanitizer.Sanitize(detail));

        return new PublishOutcome(false, null, reason, Truncate(detail, 2048));
    }

    private static string BuildStorageHtml(string? markdownOrPlain)
    {
        string trimmed = markdownOrPlain ?? string.Empty;
        string escaped = WebUtility.HtmlEncode(trimmed);
        return "<pre style=\"white-space:pre-wrap;\">" + escaped + "</pre>";
    }

    private static ConfluencePublishFailureReason MapFailure(HttpStatusCode status) => status switch
    {
        HttpStatusCode.Unauthorized => ConfluencePublishFailureReason.Unauthorized,
        HttpStatusCode.Forbidden => ConfluencePublishFailureReason.Forbidden,
        HttpStatusCode.NotFound => ConfluencePublishFailureReason.NotFound,
        HttpStatusCode.TooManyRequests => ConfluencePublishFailureReason.RateLimited,
        HttpStatusCode.RequestEntityTooLarge => ConfluencePublishFailureReason.PayloadTooLarge,
        >= HttpStatusCode.InternalServerError => ConfluencePublishFailureReason.ServerError,
        _ => ConfluencePublishFailureReason.BadResponse
    };

    private static string Truncate(string s, int max)
    {
        if (string.IsNullOrEmpty(s) || s.Length <= max)
            return s;
        return s[..max];
    }

    private static string DescribeMissingCredentials(ConfluencePublishingOptions options) =>
        options.AuthMode switch
        {
            ItsmConnectorAuthMode.BasicApiToken =>
                "Confluence requires service account email and API token for BasicApiToken auth.",
            ItsmConnectorAuthMode.OAuth2RefreshToken =>
                "Confluence OAuth requires client id, client secret, and refresh token.",
            ItsmConnectorAuthMode.OAuth2ClientCredentials =>
                "Confluence OAuth requires client id and client secret.",
            _ => "Confluence outbound credentials are incomplete."
        };

    private sealed record ConfluenceCreateResponse(string? Id);
}
