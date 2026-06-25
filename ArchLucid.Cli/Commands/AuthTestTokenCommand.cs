using System.Diagnostics.CodeAnalysis;
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

        AuthTokenClaimsDiagnosticOutcome outcome = await AuthTokenClaimsDiagnosticClient
            .DiagnoseAsync(baseUrl, bearerToken!)
            .ConfigureAwait(false);

        if (outcome.IsMissingApiKey)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + outcome.ErrorDetail);

            return CliExitCode.ConfigurationError;
        }

        if (!outcome.IsSuccess)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + outcome.ErrorDetail);

            return CliExitCode.OperationFailed;
        }

        AdminTokenClaimsDiagnosticResponse parsed = outcome.Response!;

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(JsonSerializer.Serialize(parsed, JsonOptions));

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
