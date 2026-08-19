using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime.Batch;

/// <summary>REST transport for Azure OpenAI Batch API using the same endpoint + key as chat completions.</summary>
public sealed class AzureOpenAiBatchHttpTransport : IAzureOpenAiBatchTransport
{
    private const string ApiVersion = "2024-10-21";
    private readonly HttpClient _httpClient;
    private readonly Uri _batchBaseUri;
    private readonly ILogger<AzureOpenAiBatchHttpTransport> _logger;

    public AzureOpenAiBatchHttpTransport(
        IHttpClientFactory httpClientFactory,
        string endpoint,
        ILogger<AzureOpenAiBatchHttpTransport> logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);

        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        string normalized = AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(endpoint).TrimEnd('/');
        _batchBaseUri = new Uri($"{normalized}/openai/");
        _httpClient = httpClientFactory.CreateClient(AzureOpenAiBatchHttpClients.BatchHttpClientName);
    }

    /// <inheritdoc />
    public async Task<string> UploadBatchInputFileAsync(byte[] jsonlBytes, CancellationToken cancellationToken)
    {
        using MultipartFormDataContent form = new();
        ByteArrayContent fileContent = new(jsonlBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/jsonl");
        form.Add(fileContent, "file", $"{Guid.NewGuid():N}.jsonl");
        form.Add(new StringContent("batch"), "purpose");

        using HttpResponseMessage response = await _httpClient
            .PostAsync(new Uri(_batchBaseUri, $"files?api-version={ApiVersion}"), form, cancellationToken)
            .ConfigureAwait(false);

        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, body);

        using JsonDocument doc = JsonDocument.Parse(body);

        return doc.RootElement.GetProperty("id").GetString()
               ?? throw new InvalidOperationException("Batch file upload response missing id.");
    }

    /// <inheritdoc />
    public async Task<string> CreateBatchJobAsync(string inputFileId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(inputFileId);

        string payload = JsonSerializer.Serialize(new
        {
            input_file_id = inputFileId,
            endpoint = "/v1/chat/completions",
            completion_window = "24h",
        });

        using StringContent content = new(payload, Encoding.UTF8, "application/json");

        using HttpResponseMessage response = await _httpClient
            .PostAsync(new Uri(_batchBaseUri, $"batches?api-version={ApiVersion}"), content, cancellationToken)
            .ConfigureAwait(false);

        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, body);

        using JsonDocument doc = JsonDocument.Parse(body);

        return doc.RootElement.GetProperty("id").GetString()
               ?? throw new InvalidOperationException("Batch create response missing id.");
    }

    /// <inheritdoc />
    public async Task<string> GetBatchStatusAsync(string batchJobId, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await _httpClient
            .GetAsync(new Uri(_batchBaseUri, $"batches/{batchJobId}?api-version={ApiVersion}"), cancellationToken)
            .ConfigureAwait(false);

        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, body);

        using JsonDocument doc = JsonDocument.Parse(body);

        return doc.RootElement.GetProperty("status").GetString() ?? string.Empty;
    }

    /// <inheritdoc />
    public async Task<string?> GetBatchOutputFileIdAsync(string batchJobId, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await _httpClient
            .GetAsync(new Uri(_batchBaseUri, $"batches/{batchJobId}?api-version={ApiVersion}"), cancellationToken)
            .ConfigureAwait(false);

        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, body);

        using JsonDocument doc = JsonDocument.Parse(body);

        if (!doc.RootElement.TryGetProperty("output_file_id", out JsonElement outputFileId))
            return null;

        return outputFileId.GetString();
    }

    /// <inheritdoc />
    public async Task<string> DownloadFileContentAsync(string fileId, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await _httpClient
            .GetAsync(new Uri(_batchBaseUri, $"files/{fileId}/content?api-version={ApiVersion}"), cancellationToken)
            .ConfigureAwait(false);

        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, body);

        return body;
    }

    private void EnsureSuccess(HttpResponseMessage response, string body)
    {
        if (response.IsSuccessStatusCode)
            return;

        if (_logger.IsEnabled(LogLevel.Error))
        {
            _logger.LogError(
                "Azure OpenAI batch HTTP call failed with status {StatusCode}: {Body}",
                (int)response.StatusCode,
                body);
        }

        response.EnsureSuccessStatusCode();
    }
}
