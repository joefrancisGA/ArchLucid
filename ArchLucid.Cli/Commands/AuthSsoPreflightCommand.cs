using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Offline enterprise SSO preflight from merged appsettings (improvement #13).
///     Does not perform user login or print secrets.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Console orchestration; evaluator covered by unit tests.")]
internal static class AuthSsoPreflightCommand
{
    private static readonly JsonSerializerOptions JsonWriter = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true,
    };

    internal static async Task<int> RunAsync(CancellationToken cancellationToken = default)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli = CliCommandShared.TryLoadConfigFromCwd();
        string contentRoot = Directory.GetCurrentDirectory();
        IConfiguration configuration = ValidateConfigConfigurationFactory.BuildMerged(cli, contentRoot);

        IReadOnlyList<AuthSsoPreflightCheckResult> results = await AuthSsoPreflightEvaluator
            .EvaluateAsync(configuration, contentRoot, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        int failures = results.Count(static r => r.Status == AuthSsoPreflightCheckStatus.Fail);
        int warnings = results.Count(static r => r.Status == AuthSsoPreflightCheckStatus.Warn);
        int passed = results.Count(static r => r.Status == AuthSsoPreflightCheckStatus.Pass);
        bool ok = failures == 0;

        if (CliExecutionContext.JsonOutput)
            WriteJson(results, ok, failures, warnings, passed);
        else
            WriteConsole(results, ok, failures, warnings, passed);

        return ok ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    internal static void WriteUsage()
    {
        Console.WriteLine("Usage: archlucid auth sso-preflight");
        Console.WriteLine();
        Console.WriteLine("Offline check of merged appsettings for OIDC/JwtBearer, SAML SP, SCIM posture, and Key Vault references.");
        Console.WriteLine("Does not print secrets. For live token/tenant mapping status, also run `archlucid auth diagnostics`.");
        Console.WriteLine("Docs: docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md");
    }

    private static void WriteJson(
        IReadOnlyList<AuthSsoPreflightCheckResult> results,
        bool ok,
        int failures,
        int warnings,
        int passed)
    {
        var payload = new
        {
            ok,
            summary = new { failures, warnings, passed },
            checks = results.Select(static r => new
            {
                component = r.Component,
                status = r.Status.ToString(),
                detail = r.Detail,
            }),
        };

        Console.WriteLine(JsonSerializer.Serialize(payload, JsonWriter));
    }

    private static void WriteConsole(
        IReadOnlyList<AuthSsoPreflightCheckResult> results,
        bool ok,
        int failures,
        int warnings,
        int passed)
    {
        ConsoleColor previous = Console.ForegroundColor;

        try
        {
            WriteColored(ok ? ConsoleColor.Green : ConsoleColor.Red, ok ? "[PASS]" : "[FAIL]");
            Console.WriteLine(" archlucid auth sso-preflight");
            Console.WriteLine();
            Console.WriteLine($"{"STATUS",-8} {"COMPONENT",-32} DETAIL");
            Console.WriteLine(new string('-', 100));

            foreach (AuthSsoPreflightCheckResult result in results)
            {
                WriteColored(StatusColor(result.Status), result.Status.ToString().PadRight(8));
                Console.Write($"{result.Component,-32} ");
                Console.WriteLine(result.Detail);
            }

            Console.WriteLine(new string('-', 100));
            WriteLineColored(
                warnings > 0 ? ConsoleColor.Yellow : ConsoleColor.Gray,
                $"Summary: {failures} failure(s), {warnings} warning(s), {passed} passed.");
        }
        finally
        {
            Console.ForegroundColor = previous;
        }
    }

    private static ConsoleColor StatusColor(AuthSsoPreflightCheckStatus status) =>
        status switch
        {
            AuthSsoPreflightCheckStatus.Fail => ConsoleColor.Red,
            AuthSsoPreflightCheckStatus.Warn => ConsoleColor.Yellow,
            AuthSsoPreflightCheckStatus.Pass => ConsoleColor.Green,
            _ => ConsoleColor.Cyan,
        };

    private static void WriteColored(ConsoleColor color, string text)
    {
        ConsoleColor prev = Console.ForegroundColor;
        Console.ForegroundColor = color;
        Console.Write(text);
        Console.ForegroundColor = prev;
    }

    private static void WriteLineColored(ConsoleColor color, string line)
    {
        ConsoleColor before = Console.ForegroundColor;
        Console.ForegroundColor = color;
        Console.WriteLine(line);
        Console.ForegroundColor = before;
    }
}
