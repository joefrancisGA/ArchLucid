using System.Diagnostics.CodeAnalysis;
using System.Text;

using ArchLucid.Cli.Stack;
using ArchLucid.Cli.Stack.Doctor;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Unified deployment readiness router (TB-658): prerequisites, config lint, drift preflight,
///     and post-deploy verification by profile.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin CLI wrapper over StackDoctorOrchestrator.")]
internal static class StackDoctorCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (!StackDoctorOptions.TryParse(args, out StackDoctorOptions? options, out string? parseError))
        {
            if (!string.IsNullOrEmpty(parseError))
                await Console.Error.WriteLineAsync(parseError).ConfigureAwait(false);

            WriteUsage();

            return CliExitCode.UsageError;
        }

        ArgumentNullException.ThrowIfNull(options);

        if (args.Any(static arg => arg is "--help" or "-h" or "/?"))
        {
            WriteUsage();

            return CliExitCode.Success;
        }

        if (!TryResolveRepositoryRoot(options, out string? repositoryRoot, out string? rootError))
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + rootError).ConfigureAwait(false);

            return CliExitCode.ConfigurationError;
        }

        if (!TryResolveProfile(options, repositoryRoot!, out string profile, out string? profileError))
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + profileError).ConfigureAwait(false);
            WriteUsage();

            return CliExitCode.UsageError;
        }

        StackDoctorOrchestrator orchestrator = new();
        StackDoctorReport report = await orchestrator.RunAsync(
                repositoryRoot!,
                profile,
                options,
                cancellationToken)
            .ConfigureAwait(false);

        string? jsonOut = options.JsonOutPath;
        string? markdownOut = options.MarkdownOutPath;

        if (!string.IsNullOrWhiteSpace(jsonOut) || !string.IsNullOrWhiteSpace(markdownOut))
        {
            string json = StackDoctorReportFormatter.ToJson(report);

            if (!string.IsNullOrWhiteSpace(jsonOut))
                await File.WriteAllTextAsync(jsonOut, json, Encoding.UTF8, cancellationToken).ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(markdownOut))
            {
                string markdown = StackDoctorReportFormatter.ToMarkdown(report);
                await File.WriteAllTextAsync(markdownOut, markdown, Encoding.UTF8, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        if (options.JsonStdout)
            Console.WriteLine(StackDoctorReportFormatter.ToJson(report));
        else
            StackDoctorReportFormatter.WriteConsoleSummary(report);

        int exitCode = StackDoctorVerdictRollup.ToExitCode(report.OverallVerdict);

        return exitCode == 0 ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static bool TryResolveRepositoryRoot(
        StackDoctorOptions options,
        out string? repositoryRoot,
        out string? error)
    {
        repositoryRoot = null;
        error = null;

        if (!ArchlucidStackWorkspaceResolver.TryResolveRepositoryRoot(options.RepositoryRoot, out repositoryRoot))
        {
            error = "Could not resolve repository root. Run from the ArchLucid repo or pass --repo-root.";

            return false;
        }

        return true;
    }

    private static bool TryResolveProfile(
        StackDoctorOptions options,
        string repositoryRoot,
        out string profile,
        out string? error)
    {
        profile = string.Empty;
        error = null;

        if (!string.IsNullOrWhiteSpace(options.Profile))
        {
            if (!StackDoctorProfile.TryNormalize(options.Profile, out profile))
            {
                error =
                    $"Unknown profile '{options.Profile}'. Expected: {StackDoctorProfile.DescribeUsageList()}.";

                return false;
            }

            return true;
        }

        string? answersPath = ResolveAnswersPath(options, repositoryRoot);

        if (answersPath is not null
            && StackDoctorProfileResolver.TryResolveFromAnswersFile(answersPath, out profile, out _))
        {
            return true;
        }

        profile = StackDoctorProfile.FirstPilotMinimum;

        return true;
    }

    private static string? ResolveAnswersPath(StackDoctorOptions options, string repositoryRoot)
    {
        if (!string.IsNullOrWhiteSpace(options.AnswersPath))
            return Path.GetFullPath(options.AnswersPath);

        string defaultPath = Path.Combine(repositoryRoot, ArchlucidStackPaths.DefaultAnswersFileName);

        if (File.Exists(defaultPath))
            return defaultPath;

        return null;
    }

    private static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid stack doctor [--profile "
            + StackDoctorProfile.DescribeUsageList()
            + "] [--answers <path>] [--repo-root <dir>] [--api-base-url <url>] [--environment staging|production|dev] [--json] [--json-out <path>] [--markdown-out <path>]");
        Console.WriteLine();
        Console.WriteLine("Profiles:");
        Console.WriteLine("  FirstPilotMinimum | StagingRealLlm | ProductionLike — prerequisites + config lint");
        Console.WriteLine("  staging-deploy — prerequisites + terraform drift + production-like config lint");
        Console.WriteLine("  post-deploy — deployment-evidence + onboard-preflight (requires --api-base-url)");
        Console.WriteLine();
        Console.WriteLine("When --profile is omitted, reads azure.environment from archlucid.stack.yaml when present.");
        Console.WriteLine("Docs: docs/library/FIRST_AZURE_DEPLOYMENT.md · docs/runbooks/PILOT_PREREQUISITES.md");
    }
}
