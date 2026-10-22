using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.CloudInventoryExtractor;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Offline <c>archlucid aws validate-zip</c> / <c>archlucid gcp validate-zip</c> for inventory packages before upload.
/// </summary>
internal static class CloudInventoryValidateZipCommand
{
    private static readonly JsonSerializerOptions JsonCamel =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    internal static Task<int> RunAsync(CloudProvider cloudProvider, string[] args)
    {
        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
        {
            throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Only Aws or Gcp supported.");
        }

        string commandPrefix = cloudProvider == CloudProvider.Aws ? "aws" : "gcp";

        if (!TryResolveZipPath(args, out string? zipPath, out string? parseError))
        {
            EmitUsage(commandPrefix, parseError);

            return Task.FromResult(CliExitCode.UsageError);
        }

        CloudInventoryExtractorZipValidationResult outcome =
            CloudInventoryExtractorPackageZipValidator.ValidateFile(zipPath);

        if (outcome.IsValid)
        {
            EmitSuccess(commandPrefix, zipPath, outcome.FileEntryCount);

            return Task.FromResult(CliExitCode.Success);
        }

        EmitFailure(commandPrefix, zipPath, outcome);

        return Task.FromResult(CliExitCode.UsageError);
    }

    private static void EmitSuccess(string commandPrefix, string zipPath, int fileEntryCount)
    {
        string absolutePath = Path.GetFullPath(zipPath.Trim());
        string providerLabel = commandPrefix.ToUpperInvariant();

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(
                JsonSerializer.Serialize(
                    new
                    {
                        ok = true,
                        provider = commandPrefix,
                        zip = absolutePath,
                        fileEntryCount,
                        schemaVersion = CloudInventoryExtractorPackageZipValidator.SupportedSchemaVersion,
                    },
                    JsonCamel));

            return;
        }

        Console.WriteLine(
            $"Valid {providerLabel} inventory ZIP: {absolutePath} ({fileEntryCount} file entr{(fileEntryCount == 1 ? "y" : "ies")}, schemaVersion {CloudInventoryExtractorPackageZipValidator.SupportedSchemaVersion}).");
    }

    private static void EmitFailure(
        string commandPrefix,
        string zipPath,
        CloudInventoryExtractorZipValidationResult outcome)
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
                        error = $"{commandPrefix}_validate_zip",
                        zip = absolutePath,
                        detail,
                        outcome.IsInvalidArchive,
                        outcome.IsSchemaRejection,
                        outcome.FileEntryCount,
                    },
                    JsonCamel));

            return;
        }

        Console.Error.WriteLine($"[{commandPrefix} validate-zip] {detail} ({absolutePath})");
    }

    private static void EmitUsage(string commandPrefix, string? detail)
    {
        string usage = $"Usage: archlucid {commandPrefix} validate-zip --path <file.zip> (alias: -p)";

        if (CliExecutionContext.JsonOutput)
        {
            string message = detail is null ? usage : $"{usage} {detail}";

            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                $"{commandPrefix}_validate_zip",
                message);

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
