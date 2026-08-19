using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Sends one HTTP call, times it, and optionally validates the JSON body.</summary>
public sealed class JourneyHttpExecutor(
    HttpClient http,
    ResponseValidationPipeline validationPipeline)
{
    private const string CorrelationHeaderName = "X-Correlation-ID";

    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ResponseValidationPipeline _validationPipeline =
        validationPipeline ?? throw new ArgumentNullException(nameof(validationPipeline));

    public async Task<TimedHttpResult> SendJsonAsync(
        string stepName,
        HttpMethod method,
        string relativeUrl,
        HttpContent? content,
        string? schemaName,
        Type? dtoType,
        IReadOnlyDictionary<string, string>? extraHeaders,
        CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = new(method, relativeUrl);

        if (content is not null)
            request.Content = content;

        if (extraHeaders is not null)

            foreach (KeyValuePair<string, string> header in extraHeaders)
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);

        Stopwatch stopwatch = Stopwatch.StartNew();
        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return TimedHttpResult.Failed(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"Transport error: {ex.Message}",
                correlationId: null,
                rawJson: null);
        }

        stopwatch.Stop();
        string? correlationId = TryReadCorrelationId(response);
        string bodyText = await response.Content.ReadAsStringAsync(cancellationToken);
        int statusCode = (int)response.StatusCode;

        if (!response.IsSuccessStatusCode)
        {
            return TimedHttpResult.Failed(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"{method} {relativeUrl} → HTTP {statusCode}: {Truncate(bodyText, 400)}",
                correlationId,
                rawJson: bodyText,
                failureHint: "Inspect Problem+JSON detail and correlation id.");
        }

        if (schemaName is null || dtoType is null)
        {
            return TimedHttpResult.Succeeded(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"{method} {relativeUrl} → HTTP {statusCode}",
                correlationId,
                rawJson: bodyText,
                validationErrors: []);
        }

        JsonDocument document;

        try
        {
            document = JsonDocument.Parse(string.IsNullOrWhiteSpace(bodyText) ? "null" : bodyText);
        }
        catch (JsonException ex)
        {
            return TimedHttpResult.Failed(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"Response was not valid JSON: {ex.Message}",
                correlationId,
                rawJson: bodyText);
        }

        using (document)
        {
            ResponseValidationResult validation =
                _validationPipeline.ValidateJson(schemaName, dtoType, document.RootElement);

            if (!validation.Passed)
            {
                return TimedHttpResult.Failed(
                    stepName,
                    stopwatch.ElapsedMilliseconds,
                    $"{method} {relativeUrl} → HTTP {statusCode} but JSON validation failed ({validation.Errors.Count} error(s)).",
                    correlationId,
                    rawJson: bodyText,
                    failureHint: "OpenAPI schema, property completeness, and/or DTO AdditionalProperties checks failed.",
                    validationErrors: validation.Errors);
            }

            return TimedHttpResult.Succeeded(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"{method} {relativeUrl} → HTTP {statusCode}; JSON validated against {schemaName} + {dtoType.Name}.",
                correlationId,
                rawJson: bodyText,
                validationErrors: validation.Errors);
        }
    }

    public async Task<TimedHttpResult> SendBinaryAsync(
        string stepName,
        HttpMethod method,
        string relativeUrl,
        CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = new(method, relativeUrl);
        Stopwatch stopwatch = Stopwatch.StartNew();
        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return TimedHttpResult.Failed(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"Transport error: {ex.Message}",
                correlationId: null,
                rawJson: null);
        }

        stopwatch.Stop();
        string? correlationId = TryReadCorrelationId(response);
        int statusCode = (int)response.StatusCode;

        if (!response.IsSuccessStatusCode)
        {
            string bodyText = await response.Content.ReadAsStringAsync(cancellationToken);
            return TimedHttpResult.Failed(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"{method} {relativeUrl} → HTTP {statusCode}: {Truncate(bodyText, 400)}",
                correlationId,
                rawJson: bodyText);
        }

        byte[] bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        MediaTypeHeaderValue? contentType = response.Content.Headers.ContentType;

        if (bytes.Length == 0)
        {
            return TimedHttpResult.Failed(
                stepName,
                stopwatch.ElapsedMilliseconds,
                $"{method} {relativeUrl} → HTTP {statusCode} but body was empty.",
                correlationId,
                rawJson: null);
        }

        return TimedHttpResult.Succeeded(
            stepName,
            stopwatch.ElapsedMilliseconds,
            $"{method} {relativeUrl} → HTTP {statusCode}; {bytes.Length} bytes; content-type={contentType?.MediaType ?? "<none>"}.",
            correlationId,
            rawJson: null,
            validationErrors: []);
    }

    public static StringContent JsonContent(string json)
    {
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private static string? TryReadCorrelationId(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues(CorrelationHeaderName, out IEnumerable<string>? values))
            return values.FirstOrDefault();

        return null;
    }

    private static string Truncate(string text, int max)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= max)
            return text;

        return text[..max] + "…";
    }
}
