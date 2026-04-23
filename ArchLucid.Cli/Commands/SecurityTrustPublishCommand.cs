using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Trust;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Calls <c>POST /v1/admin/security-trust/publications</c> (AdminAuthority + API key) and prints the operator badge
///     URL.
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "HTTP; exercised via SecurityTrustPublishCommandTests with a stub HttpClient.")]
internal static class SecurityTrustPublishCommand
{
    private static readonly JsonSerializerOptions JsonWrite = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        SecurityTrustPublishCommandOptions? opts =
            SecurityTrustPublishCommandOptions.Parse(args, out string? parseError);

        if (opts is null)
        {
            await Console.Error.WriteLineAsync(parseError);

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(outcome);

        string normalized = baseUrl.Trim().TrimEnd('/');
        using HttpClient http = new() { BaseAddress = new Uri(normalized + "/") };
        http.DefaultRequestHeaders.Remove("Accept");
        http.DefaultRequestHeaders.Add("Accept", "application/json");

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            http.DefaultRequestHeaders.Remove("X-Api-Key");
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        }

        return await ExecutePublicationAsync(http, opts, cancellationToken);
    }

    internal static async Task<int> ExecutePublicationAsync(
        HttpClient http,
        SecurityTrustPublishCommandOptions opts,
        CancellationToken cancellationToken)
    {
        SecurityAssessmentPublicationRequest body = new()
        {
            AssessmentCode = opts.AssessmentCode,
            SummaryReference = opts.SummaryUrl,
            AssessorDisplayName = opts.AssessorDisplayName,
            PublishedOn = opts.PublishedOn
        };

        using HttpResponseMessage response =
            await http.PostAsJsonAsync("v1/admin/security-trust/publications", body, JsonWrite, cancellationToken);

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            await Console.Error.WriteLineAsync(
                "Admin API key with AdminAuthority is required for security-trust publish.");

            return CliExitCode.OperationFailed;
        }

        if (response.StatusCode == HttpStatusCode.BadRequest)
        {
            string responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            await Console.Error.WriteLineAsync($"Validation failed (400): {responseBody}");

            return CliExitCode.UsageError;
        }

        if (response.StatusCode != HttpStatusCode.NoContent)
        {
            string responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            await Console.Error.WriteLineAsync($"API error {(int)response.StatusCode}: {responseBody}");

            return CliExitCode.OperationFailed;
        }

        string badge = $"{opts.UiBaseUrl.TrimEnd('/')}/security-trust";
        await Console.Out.WriteLineAsync("Recorded SecurityAssessmentPublished audit event.");
        await Console.Out.WriteLineAsync($"Operator badge URL: {badge}");

        return CliExitCode.Success;
    }
}
