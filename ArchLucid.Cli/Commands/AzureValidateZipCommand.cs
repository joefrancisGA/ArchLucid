using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Cli.Commands;

/// <summary>Offline <c>archlucid azure validate-zip --path &lt;file&gt;</c> for extractor packages before upload.</summary>
internal static class AzureValidateZipCommand
{
    private static readonly JsonSerializerOptions JsonCamel =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    internal static Task<int> RunAsync(string[] args)
    {
        if (!TryResolveZipPath(args, out string? zipPath, out string? parseError))
        {
            EmitUsage(parseError);

            return Task.FromResult(CliExitCode.UsageError);
        }

        AzureExtractorZipValidationResult outcome = AzureExtractorPackageZipValidator.ValidateFile(zipPath);

        if (outcome.IsValid)
        {
            EmitSuccess(zipPath, outcome.FileEntryCount);

            return Task.FromResult(CliExitCode.Success);
        }

        EmitFailure(zipPath, outcome);

        return Task.FromResult(CliExitCode.UsageError);
    }

    private static void EmitSuccess(string zipPath, int fileEntryCount)
    {
        string absolutePath = Path.GetFullPath(zipPath.Trim());

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(
                JsonSerializer.Serialize(
                    new
                    {
                        ok = true,
                        zip = absolutePath,
                        fileEntryCount,
                        schemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
                    },
                    JsonCamel));

            return;
        }

        Console.WriteLine(
            $"Valid Azure extractor ZIP: {absolutePath} ({fileEntryCount} file entr{(fileEntryCount == 1 ? "y" : "ies")}, schemaVersion {AzureExtractorPackageZipValidator.SupportedSchemaVersion}).");
    }

    private static void EmitFailure(string zipPath, AzureExtractorZipValidationResult outcome)
    {
        string absolutePath = Path.GetFullPath(zipPath.Trim());
        string detail = outcome.ErrorDetail ?? "Validation failed.";

        if (CliExecutionContext.JsonOutput)
        {
            Console.Error.WriteLine(
                JsonSerializer.Serialize(
                    new
                    {
                        ok = false,
                        exitCode = CliExitCode.UsageError,
                        error = "azure_validate_zip",
                        zip = absolutePath,
                        detail,
                        outcome.IsInvalidArchive,
                        outcome.IsSchemaRejection,
                        outcome.FileEntryCount,
                    },
                    JsonCamel));

            return;
        }

        Console.Error.WriteLine($"[azure validate-zip] {detail} ({absolutePath})");
    }

    private static void EmitUsage(string? detail)
    {
        const string usage = "Usage: archlucid azure validate-zip --path <file.zip> (alias: -p)";

        if (CliExecutionContext.JsonOutput)
        {
            string message = detail is null ? usage : $"{usage} {detail}";

            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "azure_validate_zip", message);

            return;
        }

        Console.Error.WriteLine(usage);

        if (detail is not null)
            Console.Error.WriteLine(detail);
    }

    private static bool TryResolveZipPath(string[] args, [NotNullWhen(true)] out string? zipPath, out string? error)
    {
        zipPath = null;
        error = null;
        string? resolved = null;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];

            if (arg.Length == 0)
                continue;

            if (arg.StartsWith("--path=", StringComparison.Ordinal))
            {
                string value = arg["--path=".Length..].Trim();

                if (value.Length == 0)
                {
                    error = "Missing value after --path=.";

                    return false;
                }

                if (resolved is not null)
                {
                    error = "Only one ZIP path may be specified.";

                    return false;
                }

                resolved = value;

                continue;
            }

            if (string.Equals(arg, "--path", StringComparison.Ordinal)
                || string.Equals(arg, "-p", StringComparison.Ordinal))
            {
                if (i + 1 >= args.Length)
                {
                    error = $"Missing path after {arg}.";

                    return false;
                }

                if (resolved is not null)
                {
                    error = "Only one ZIP path may be specified.";

                    return false;
                }

                resolved = args[++i].Trim();

                if (resolved.Length == 0)
                {
                    error = "ZIP path is empty.";

                    return false;
                }

                continue;
            }

            error = $"Unexpected argument '{arg}'.";

            return false;
        }

        if (resolved is null)
        {
            error = "Missing required --path <file.zip>.";

            return false;
        }

        zipPath = resolved;

        return true;
    }
}
