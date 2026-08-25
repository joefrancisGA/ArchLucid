using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;


namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static async Task<int> HandlePolicy(string[] normalized)
    {
        if (normalized.Length > 2 && normalized[1] == "validate")
            return await PolicyValidateCommand.RunAsync(normalized[2], "policy validate");

        Console.WriteLine("Usage: archlucid policy validate <file.json>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandlePolicyPack(string[] normalized)
    {
        if (normalized.Length > 2 && normalized[1] == "validate")
            return await PolicyValidateCommand.RunAsync(normalized[2], "policy-pack validate");

        Console.WriteLine("Usage: archlucid policy-pack validate <file.json>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandlePack(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "export-scaffold", StringComparison.Ordinal))
            return await PackExportScaffoldCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid pack export-scaffold [--output <path>] [--force]");
        else
            Console.WriteLine("Usage: archlucid pack export-scaffold [--output <path>] [--force]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleTemplates(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "list", StringComparison.Ordinal))
            return await TemplatesListCommand.RunAsync(normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid templates list [--repo-root <dir>]");
        else
            Console.WriteLine("Usage: archlucid templates list [--repo-root <dir>]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleGraph(string[] normalized)
    {
        if (normalized.Length > 2 && normalized[1] == "export")
            return await GraphExportCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        Console.WriteLine(
            "Usage: archlucid graph export <runId> [--format mermaid|graphml] [--decision <key>] [--out <path>]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleRules(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "simulate")
            return await RulesSimulateCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        Console.WriteLine(
            "Usage: archlucid rules simulate --run <runGuid> [--severity Warning] [--count 3]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleGoldenCohort(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "lock-baseline")
            return await GoldenCohortLockBaselineCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 1 && normalized[1] == "drift")
            return await GoldenCohortDriftCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine(
            "Usage: archlucid golden-cohort lock-baseline [--cohort <path>] [--write] | " +
            "drift [--cohort <path>] [--strict-real] [--structural-only]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleManifest(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "validate", StringComparison.Ordinal))
            return await ManifestValidateCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid manifest validate --file <path-to.json>");
        else
            Console.WriteLine("Usage: archlucid manifest validate --file <path-to.json>");

        return CliExitCode.UsageError;
    }


}
