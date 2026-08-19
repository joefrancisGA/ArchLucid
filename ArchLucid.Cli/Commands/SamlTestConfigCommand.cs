using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Auth.Saml;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Validates SAML 2.0 SP configuration from local <c>appsettings</c> (metadata URL reachability, signing certificate).
///     Does not perform a SAML authentication exchange.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Console/report integration; diagnostics covered by Core tests.")]
internal static class SamlTestConfigCommand
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };

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

        IConfiguration configuration = ValidateConfigConfigurationFactory.BuildMerged(cli);

        SamlSpConfigurationSnapshot snapshot = configuration
                .GetSection(SamlSpConfigurationSnapshot.ConfigurationSectionPath)
                .Get<SamlSpConfigurationSnapshot>()
            ?? new SamlSpConfigurationSnapshot();

        IReadOnlyList<SamlTestConfigComponentResult> results = await SamlSpConfigurationDiagnostics.EvaluateAsync(
            snapshot,
            contentRoot,
            Http,
            cancellationToken).ConfigureAwait(false);

        int failures = results.Count(static r => r.Status == SamlTestConfigComponentStatus.Fail);

        int warnings = results.Count(static r => r.Status == SamlTestConfigComponentStatus.Warn);

        int passed = results.Count(static r => r.Status == SamlTestConfigComponentStatus.Pass);

        bool ok = failures == 0;

        if (CliExecutionContext.JsonOutput)
            WriteJson(results, ok, failures, warnings, passed);
        else
            WriteConsoleReport(results, ok, failures, warnings, passed);

        return ok ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static void WriteJson(
        IReadOnlyList<SamlTestConfigComponentResult> results,
        bool ok,
        int failures,
        int warnings,
        int passed)
    {
        var payload = new
        {
            ok,
            summary = new
            {
                failures,
                warnings,
                passed,
                info = results.Count(static r => r.Status == SamlTestConfigComponentStatus.Info),
            },
            checks = results
                .Select(static r => new
                {
                    component = r.Component,
                    status = r.Status.ToString(),
                    detail = r.Detail,
                })
                .ToList(),
        };

        Console.WriteLine(JsonSerializer.Serialize(payload, JsonWriter));
    }

    private static void WriteConsoleReport(
        IReadOnlyList<SamlTestConfigComponentResult> results,
        bool ok,
        int failures,
        int warnings,
        int passed)
    {
        ConsoleColor previous = Console.ForegroundColor;

        try
        {
            WriteColored(ok ? ConsoleColor.Green : ConsoleColor.Red, ok ? "[PASS]" : "[FAIL]");
            Console.WriteLine(" archlucid saml test-config");

            Console.WriteLine();
            Console.WriteLine($"{"STATUS",-8} {"COMPONENT",-32} DETAIL");
            Console.WriteLine(new string('-', Math.Min(120, SeparatorLineLength())));

            foreach (SamlTestConfigComponentResult result in results)
            {
                WriteColored(StatusToColor(result.Status), result.Status.ToString().PadRight(8));
                Console.Write($"{result.Component,-32} ");
                Console.WriteLine(result.Detail);
            }

            Console.WriteLine(new string('-', Math.Min(120, SeparatorLineLength())));

            WriteLineColored(
                warnings > 0 ? ConsoleColor.Yellow : ConsoleColor.Gray,
                $"Summary: {failures} failure(s), {warnings} warning(s), {passed} passed.");
        }

        finally
        {
            Console.ForegroundColor = previous;
        }
    }

    private static int SeparatorLineLength()
    {
        try
        {
            int w = Console.WindowWidth;

            return w > 1 ? w - 1 : 120;
        }
        catch (IOException)
        {
            return 120;
        }
        catch (System.ComponentModel.Win32Exception)
        {
            return 120;
        }
    }

    private static ConsoleColor StatusToColor(SamlTestConfigComponentStatus status) =>
        status switch
        {
            SamlTestConfigComponentStatus.Fail => ConsoleColor.Red,
            SamlTestConfigComponentStatus.Warn => ConsoleColor.Yellow,
            SamlTestConfigComponentStatus.Pass => ConsoleColor.Green,
            SamlTestConfigComponentStatus.Info => ConsoleColor.Cyan,
            _ => ConsoleColor.Gray,
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
