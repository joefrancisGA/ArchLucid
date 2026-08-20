using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Services.Delivery;

namespace ArchLucid.Api.Services;

/// <summary>
///     POSTs CloudEvents-shaped JSON aligned with CLI webhooks test; signs with <see cref="WebhookSignature" /> when
///     secret is set.
/// </summary>
public sealed class OutboundWebhookDryRunService(HttpClient httpClient) : IOutboundWebhookDryRunService
{
    private const int PreviewMaxChars = 8192;

    private static readonly JsonSerializerOptions JsonCamel = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly HttpClient _http = httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    /// <inheritdoc />
    public Task<OutboundWebhookDryRunResult> ProbeAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default) =>
        ProbeWithBodyAsync(targetUrl, sharedSecret, BuildSyntheticFindingCreatedWebhookBodyUtf8(), cancellationToken);

    /// <inheritdoc />
    public Task<OutboundWebhookDryRunResult> ProbeAuthorityRunCompletedAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default) =>
        ProbeWithBodyAsync(targetUrl, sharedSecret, BuildAuthorityRunCompletedWebhookBodyUtf8(), cancellationToken);

    internal async Task<OutboundWebhookDryRunResult> ProbeWithBodyAsync(
        Uri targetUrl,
        string? sharedSecret,
        byte[] bodyUtf8,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(targetUrl);
        ArgumentNullException.ThrowIfNull(bodyUtf8);

        using HttpRequestMessage request = new(HttpMethod.Post, targetUrl);
        request.Content = new ByteArrayContent(bodyUtf8);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json") { CharSet = "utf-8" };

        string? trimmedSecret = sharedSecret?.Trim();

        if (!string.IsNullOrEmpty(trimmedSecret))
        {
            string hex = WebhookSignature.ComputeSha256Hex(trimmedSecret, bodyUtf8);

            request.Headers.TryAddWithoutValidation(WebhookSignature.HeaderName, WebhookSignature.Prefix + hex);
        }

        try
        {
            using HttpResponseMessage response =
                await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            string full = await response.Content.ReadAsStringAsync(cancellationToken);
            bool truncated = full.Length > PreviewMaxChars;
            string preview = truncated ? full[..PreviewMaxChars] : full;

            return new OutboundWebhookDryRunResult
            {
                TransportSucceeded = true,
                StatusCode = (int)response.StatusCode,
                ReasonPhrase = response.ReasonPhrase,
                ResponseBodyPreview = preview,
                ResponseBodyTruncated = truncated
            };
        }
        catch (Exception ex)
        {
            return new OutboundWebhookDryRunResult
            {
                TransportSucceeded = false, StatusCode = 0, Error = $"{ex.GetType().Name}: {ex.Message}"
            };
        }
    }

    internal static byte[] BuildSyntheticFindingCreatedWebhookBodyUtf8()
    {
        Dictionary<string, object?> envelope = new()
        {
            ["specversion"] = "1.0",
            ["type"] = "com.archlucid.finding.created.sample",
            ["source"] = "https://api.archlucid.local/v1/webhooks/dry-run",
            ["id"] = Guid.NewGuid().ToString("D"),
            ["time"] = TimeProvider.System.UtcNowDateTime().ToString("O"),
            ["datacontenttype"] = "application/json",
            ["data"] = new Dictionary<string, object?>
            {
                ["tenantId"] = Guid.Empty.ToString("D"),
                ["findingId"] = Guid.NewGuid().ToString("D"),
                ["runId"] = Guid.NewGuid().ToString("D"),
                ["note"] =
                    "Synthetic webhook dry-run (no persistence); validate signature + payload at your subscriber."
            }
        };

        string json = JsonSerializer.Serialize(envelope, JsonCamel);

        return Encoding.UTF8.GetBytes(json);
    }

    internal static byte[] BuildAuthorityRunCompletedWebhookBodyUtf8()
    {
        Guid runId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        Dictionary<string, object?> data = new()
        {
            ["schemaVersion"] = 1,
            ["runId"] = runId,
            ["manifestId"] = Guid.NewGuid(),
            ["tenantId"] = tenantId,
            ["workspaceId"] = workspaceId,
            ["projectId"] = projectId,
            ["previousRunId"] = Guid.NewGuid(),
            ["findings"] = new[]
            {
                new Dictionary<string, object?>
                {
                    ["findingId"] = "finding-primary",
                    ["deepLinkUrl"] = $"https://archlucid.net/runs/{runId:D}/findings/finding-primary",
                    ["severity"] = "High"
                }
            },
            ["note"] =
                "Synthetic AuthorityRunCompleted simulation (no persistence); validate signature + payload at your subscriber."
        };

        Dictionary<string, object?> envelope = new()
        {
            ["specversion"] = "1.0",
            ["type"] = IntegrationEventTypes.AuthorityRunCompletedV1,
            ["source"] = "https://api.archlucid.local/v1/integrations/webhooks/simulate",
            ["id"] = Guid.NewGuid().ToString("D"),
            ["time"] = TimeProvider.System.UtcNowDateTime().ToString("O"),
            ["datacontenttype"] = "application/json",
            ["data"] = data
        };

        string json = JsonSerializer.Serialize(envelope, JsonCamel);

        return Encoding.UTF8.GetBytes(json);
    }
}
