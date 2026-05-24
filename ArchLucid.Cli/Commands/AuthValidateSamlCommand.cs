using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Identity;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Validates SAML IdP metadata XML and workforce SSO claim-mapping JSON without a running API host.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Console/report integration; validators covered by Core tests.")]
internal static class AuthValidateSamlCommand
{
    private static readonly JsonSerializerOptions JsonReader = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private static readonly JsonSerializerOptions JsonWriter = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true,
    };

    internal static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        string? metadataPath = CliCommandShared.TryGetOptionValue(args, "--metadata");
        string? claimMappingPath = CliCommandShared.TryGetOptionValue(args, "--claim-mapping");

        if (string.IsNullOrWhiteSpace(metadataPath) || string.IsNullOrWhiteSpace(claimMappingPath))
        {
            WriteUsage();

            return CliExitCode.UsageError;
        }

        string metadataXml;

        try
        {
            metadataXml = await File.ReadAllTextAsync(metadataPath, cancellationToken);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            await WriteErrorAsync("metadata_read_error", ex.Message);

            return CliExitCode.OperationFailed;
        }

        IdentityClaimRoleMappingDocument? mapping;

        try
        {
            await using FileStream stream = File.OpenRead(claimMappingPath);
            mapping = await JsonSerializer.DeserializeAsync<IdentityClaimRoleMappingDocument>(stream, JsonReader, cancellationToken);
        }
        catch (Exception ex) when (ex is IOException or JsonException or UnauthorizedAccessException)
        {
            await WriteErrorAsync("claim_mapping_read_error", ex.Message);

            return CliExitCode.OperationFailed;
        }

        if (mapping is null)
        {
            await WriteErrorAsync("claim_mapping_read_error", "Claim mapping JSON deserialized to null.");

            return CliExitCode.OperationFailed;
        }

        List<SamlTestConfigComponentResult> results = [];
        results.AddRange(SamlIdpMetadataFileDiagnostics.Evaluate(metadataXml));
        results.AddRange(IdentityClaimRoleMappingValidator.Evaluate(mapping));

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

    internal static void WriteUsage()
    {
        const string plain =
            "Usage: archlucid auth validate-saml --metadata <idp-metadata.xml> --claim-mapping <mapping.json>";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
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
            Console.WriteLine(" archlucid auth validate-saml");
            Console.WriteLine();
            Console.WriteLine($"{"STATUS",-8} {"COMPONENT",-36} DETAIL");
            Console.WriteLine(new string('-', 120));

            foreach (SamlTestConfigComponentResult result in results)
            {
                WriteColored(StatusToColor(result.Status), result.Status.ToString().PadRight(8));
                Console.Write($"{result.Component,-36} ");
                Console.WriteLine(result.Detail);
            }

            Console.WriteLine(new string('-', 120));
            WriteLineColored(
                warnings > 0 ? ConsoleColor.Yellow : ConsoleColor.Gray,
                $"Summary: {failures} failure(s), {warnings} warning(s), {passed} passed.");
        }
        finally
        {
            Console.ForegroundColor = previous;
        }
    }

    private static async Task WriteErrorAsync(string code, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.OperationFailed, code, message);
        else
            await Console.Error.WriteLineAsync(message);
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
