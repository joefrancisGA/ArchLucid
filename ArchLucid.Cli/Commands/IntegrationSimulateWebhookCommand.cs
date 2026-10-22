using System.Diagnostics.CodeAnalysis;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Integration;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Generates Authority-shaped integration event payloads and POSTs them to a customer webhook URL for bridge testing.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "CLI webhook probe; covered by command-line tests.")]
internal static class IntegrationSimulateWebhookCommand
{
    private static readonly JsonSerializerOptions JsonCamel = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly HttpClient Http = new();

    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        string? eventType = CliCommandShared.TryGetOptionValue(args, "--event-type");
        string? targetUrl = CliCommandShared.TryGetOptionValue(args, "--target-url");
        string? secret = CliCommandShared.TryGetOptionValue(args, "--secret");

        if (string.IsNullOrWhiteSpace(eventType) || string.IsNullOrWhiteSpace(targetUrl))
        {
            WriteUsage();

            return CliExitCode.UsageError;
        }

        if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out Uri? absolute)
            || (absolute.Scheme != Uri.UriSchemeHttp && absolute.Scheme != Uri.UriSchemeHttps))
        {
            await WriteErrorAsync("invalid_url", "Expected --target-url with an absolute http(s) URL.");

            return CliExitCode.UsageError;
        }

        string resolvedEventType;

        try
        {
            resolvedEventType = IntegrationWebhookPayloadSamples.ResolveEventType(eventType);
        }
        catch (ArgumentException ex)
        {
            await WriteErrorAsync("invalid_event_type", ex.Message);

            return CliExitCode.UsageError;
        }

        byte[] bodyUtf8 = IntegrationWebhookPayloadSamples.CreatePayloadUtf8(resolvedEventType);

        using HttpRequestMessage request = new(HttpMethod.Post, absolute);
        request.Content = new ByteArrayContent(bodyUtf8);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json") { CharSet = "utf-8" };
        request.Headers.TryAddWithoutValidation("X-ArchLucid-Event-Type", resolvedEventType);

        if (!string.IsNullOrWhiteSpace(secret))
        {
            string hex = ComputeSha256Hex(secret, bodyUtf8);
            request.Headers.TryAddWithoutValidation(
                WebhooksTestCommand.WebhookSignatureHeaderName,
                WebhooksTestCommand.WebhookSignaturePrefix + hex);
        }

        HttpResponseMessage response;

        try
        {
            response = await Http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (Exception ex)
        {
            await WriteErrorAsync("transport_error", ex.Message);

            return CliExitCode.OperationFailed;
        }

        using (response)
        {
            string responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            int status = (int)response.StatusCode;

            if (CliExecutionContext.JsonOutput)
            {
                object payload = new
                {
                    ok = response.IsSuccessStatusCode,
                    eventType = resolvedEventType,
                    statusCode = status,
                    reasonPhrase = response.ReasonPhrase,
                    responseBody = string.IsNullOrWhiteSpace(responseBody) ? null : responseBody
                };

                Console.WriteLine(JsonSerializer.Serialize(payload, JsonCamel));
            }
            else
            {
                Console.WriteLine($"Event type: {resolvedEventType}");
                Console.WriteLine($"HTTP {status} {response.ReasonPhrase}");

                if (!string.IsNullOrWhiteSpace(responseBody))
                    Console.WriteLine(responseBody);
            }

            return response.IsSuccessStatusCode ? CliExitCode.Success : CliExitCode.OperationFailed;
        }
    }

    internal static void WriteUsage()
    {
        const string plain =
            "Usage: archlucid integration simulate-webhook --event-type <alias> --target-url <url> [--secret <shared-secret>]\n"
            + "Aliases include RunCommitted, RunCompleted, ManifestFinalized, and com.archlucid.* constants.";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }

    private static string ComputeSha256Hex(string sharedSecret, byte[] utf8Body)
    {
        byte[] key = Encoding.UTF8.GetBytes(sharedSecret);

        using HMACSHA256 hmac = new(key);
        byte[] hash = hmac.ComputeHash(utf8Body);

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static async Task WriteErrorAsync(string code, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.OperationFailed, code, message);
        else
            await Console.Error.WriteLineAsync(message);
    }
}
