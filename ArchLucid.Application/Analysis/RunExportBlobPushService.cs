using System.Text.Json;

using ArchLucid.Core.Audit;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Uploads a run export ZIP to a customer-provisioned Azure Blob SAS URL via HTTP PUT.
///     Uses a named <c>RunExportBlobPush</c> <see cref="HttpClient" /> registered by the composition root.
/// </summary>
public sealed class RunExportBlobPushService(
    IHttpClientFactory httpClientFactory,
    IAuditService auditService,
    ILogger<RunExportBlobPushService> logger) : IRunExportBlobPushService
{
    /// <summary>Named HttpClient key. Register with a suitable timeout in the composition root.</summary>
    public const string HttpClientName = "RunExportBlobPush";

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<RunExportBlobPushService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task PushAsync(
        Guid runId,
        byte[] zipContent,
        string destinationSasUrl,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(zipContent);
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationSasUrl);

        HttpClient client = _httpClientFactory.CreateClient(HttpClientName);

        try
        {
            using ByteArrayContent content = new(zipContent);
            content.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue("application/zip");

            // Azure Blob Storage SAS PUT requires x-ms-blob-type: BlockBlob header.
            content.Headers.Add("x-ms-blob-type", "BlockBlob");

            HttpResponseMessage response = await client
                .PutAsync(destinationSasUrl, content, cancellationToken)
                .ConfigureAwait(false);

            bool success = response.IsSuccessStatusCode;

            if (_logger.IsEnabled(success ? LogLevel.Information : LogLevel.Warning))
            {
                if (success)
                    _logger.LogInformation(
                        "Run export blob push succeeded: RunId={RunId} StatusCode={StatusCode} Bytes={Bytes}",
                        runId, (int)response.StatusCode, zipContent.Length);
                else
                    _logger.LogWarning(
                        "Run export blob push failed: RunId={RunId} StatusCode={StatusCode}",
                        runId, (int)response.StatusCode);
            }

            AuditEvent httpOutcomeAudit = new()
            {
                EventType = success
                    ? AuditEventTypes.RunExportBlobPushSucceeded
                    : AuditEventTypes.RunExportBlobPushFailed,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    statusCode = (int)response.StatusCode,
                    bytes = zipContent.Length
                })
            };

            await DurableAuditLogRetry.TryLogAsync(
                    ct => _auditService.LogAsync(httpOutcomeAudit, ct),
                    _logger,
                    $"RunExportBlobPush:http:{runId:N}",
                    cancellationToken,
                    auditEventTypeForMetrics: httpOutcomeAudit.EventType)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Run export blob push threw an exception: RunId={RunId}", runId);

            AuditEvent exceptionOutcomeAudit = new()
            {
                EventType = AuditEventTypes.RunExportBlobPushFailed,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new { error = ex.GetType().Name })
            };

            await DurableAuditLogRetry.TryLogAsync(
                    ct => _auditService.LogAsync(exceptionOutcomeAudit, ct),
                    _logger,
                    $"RunExportBlobPush:exception:{runId:N}",
                    cancellationToken,
                    auditEventTypeForMetrics: AuditEventTypes.RunExportBlobPushFailed)
                .ConfigureAwait(false);

            throw;
        }
    }
}
