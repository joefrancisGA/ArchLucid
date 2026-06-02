using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Admin;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Calls <c>POST /v1/admin/auth/diagnose-token</c> to evaluate JWT role claims (requires admin API key).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "CLI HTTP orchestration; covered by manual operator workflows.")]
internal static class AuthTestTokenCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public static async Task<int> RunAsync(string[] args, ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        if (!TryParseArgs(args, out string? bearerToken, out string? parseError))
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + parseError);

            WriteUsage();

            return CliExitCode.UsageError;
        }

        string baseUrl = ArchLucidApiClient.ResolveBaseUrl(config);
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            await Console.Error.WriteLineAsync(
                "[ArchLucid CLI] Set ARCHLUCID_API_KEY with AdminAuthority before running auth test-token.");

            return CliExitCode.ConfigurationError;
        }

        AdminTokenClaimsDiagnosticRequest payload = new() { BearerToken = bearerToken! };
        string jsonBody = JsonSerializer.Serialize(payload, JsonOptions);

        using HttpClient httpClient = new() { BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/") };
        using HttpRequestMessage request = new(HttpMethod.Post, "v1/admin/auth/diagnose-token");
        request.Headers.Add("X-Api-Key", apiKey);
        request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        using HttpResponseMessage response = await httpClient.SendAsync(request).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            await Console.Error.WriteLineAsync(
                $"[ArchLucid CLI] POST diagnose-token failed: HTTP {(int)response.StatusCode}");
            await Console.Error.WriteLineAsync(body);

            return CliExitCode.OperationFailed;
        }

        AdminTokenClaimsDiagnosticResponse? parsed =
            JsonSerializer.Deserialize<AdminTokenClaimsDiagnosticResponse>(body, JsonOptions);

        if (parsed is null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] Could not parse diagnose-token JSON.");

            return CliExitCode.OperationFailed;
        }

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(body);

            return CliExitCode.Success;
        }

        PrintReport(parsed);

        if (parsed.ResolvedRoles.Count == 0)
            return CliExitCode.ConfigurationError;

        return CliExitCode.Success;
    }

    public static void WriteUsage()
    {
        Console.WriteLine("Usage: archlucid auth test-token --bearer <jwt>");
        Console.WriteLine();
        Console.WriteLine("Requires ARCHLUCID_API_KEY with AdminAuthority. Token signature is not validated server-side.");
        Console.WriteLine("Docs: docs/runbooks/GENERIC_OIDC_SETUP.md, docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md");
    }

    private static bool TryParseArgs(string[] args, out string? bearerToken, out string? error)
    {
        bearerToken = null;
        error = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (!string.Equals(args[i], "--bearer", StringComparison.OrdinalIgnoreCase))
                continue;

            if (i + 1 >= args.Length)
            {
                error = "Missing value for --bearer.";

                return false;
            }

            bearerToken = args[i + 1];

            return !string.IsNullOrWhiteSpace(bearerToken);
        }

        error = "Expected --bearer <jwt>.";

        return false;
    }

    private static void PrintReport(AdminTokenClaimsDiagnosticResponse parsed)
    {
        Console.WriteLine("ArchLucid token role-claim diagnostic");
        Console.WriteLine();
        Console.WriteLine("Resolved roles:");

        if (parsed.ResolvedRoles.Count == 0)
            Console.WriteLine(" (none)");
        else
            foreach (string role in parsed.ResolvedRoles)
                Console.WriteLine($" • {role}");

        Console.WriteLine();
        Console.WriteLine("Unmapped role claim values:");

        if (parsed.UnmappedValues.Count == 0)
            Console.WriteLine(" (none)");
        else
            foreach (string value in parsed.UnmappedValues)
                Console.WriteLine($" • {value}");

        Console.WriteLine();
        Console.WriteLine("Warnings:");

        foreach (string warning in parsed.Warnings)
            Console.WriteLine($" • {warning}");
    }
}
