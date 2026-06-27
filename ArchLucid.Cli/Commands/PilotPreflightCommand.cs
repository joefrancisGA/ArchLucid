using System.Diagnostics.CodeAnalysis;
using System.Text;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI HTTP orchestration; covered by PilotPreflightRunnerTests.")]
internal static class PilotPreflightCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        PilotPreflightOptions options = PilotPreflightOptions.Parse(args);

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliAuthorizedHttpClient.ResolveBaseUrl(args, config);
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

        if (urlError is not null && !options.NoApi)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        IConfiguration localConfiguration = PilotPreflightLocalSteps.LoadLocalConfiguration(options.SimulateProduction);
        IReadOnlyList<PilotPreflightStepResult> localSteps =
            PilotPreflightLocalSteps.Evaluate(localConfiguration, options.SimulateProduction);

        using HttpClient http = CliAuthorizedHttpClient.Create(options.NoApi ? "https://localhost" : baseUrl);
        PilotPreflightRunner runner = new(http);
        PilotPreflightReport report = await runner.RunAsync(
            options.NoApi ? "(offline)" : baseUrl,
            localSteps,
            options,
            cancellationToken);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(PilotPreflightRunner.SerializeJson(report));

            return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
        }

        if (options.MarkdownOutput)
        {
            string markdown = BuildMarkdown(report);

            if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            {
                await File.WriteAllTextAsync(options.MarkdownOutPath, markdown, Encoding.UTF8, cancellationToken);
                Console.WriteLine($"[ArchLucid CLI] Markdown written to: {options.MarkdownOutPath}");
            }
            else
            {
                Console.WriteLine(markdown);
            }

            return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
        }

        WriteConsoleReport(report);

        return report.AllBlockingPassed ? CliExitCode.Success : CliExitCode.OperationFailed;
    }

    private static void WriteConsoleReport(PilotPreflightReport report)
    {
        Console.WriteLine($"archlucid pilot preflight @ {report.BaseUrl}");
        Console.WriteLine(new string('-', 60));

        foreach (PilotPreflightStepResult step in report.Steps)
        {
            string label = step.Disposition switch
            {
                PilotPreflightDisposition.Pass => "PASS",
                PilotPreflightDisposition.Warn => "WARN",
                _ => "BLOCK",
            };

            Console.WriteLine($"[{label}] {step.Name,-40} {step.Detail}");

            if (!string.IsNullOrWhiteSpace(step.Remediation))
                Console.WriteLine($"        next: {step.Remediation}");
        }

        Console.WriteLine(new string('-', 60));
        Console.WriteLine(report.AllBlockingPassed
            ? $"PASS — {report.WarnCount} warning(s), 0 blocking failure(s). See docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md."
            : $"BLOCK — {report.BlockCount} blocking failure(s), {report.WarnCount} warning(s). Fix BLOCK rows before first value.");
    }

    private static string BuildMarkdown(PilotPreflightReport report)
    {
        StringBuilder sb = new();
        string timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC";

        sb.AppendLine("# ArchLucid Pilot Readiness Preflight");
        sb.AppendLine();
        sb.AppendLine($"**Target:** `{report.BaseUrl}`  ");
        sb.AppendLine($"**Generated:** {timestamp}  ");
        sb.AppendLine($"**Result:** {(report.AllBlockingPassed ? "✅ PASS" : "❌ BLOCKED")}  ");
        sb.AppendLine();
        sb.AppendLine("## Preflight Checks");
        sb.AppendLine();
        sb.AppendLine("| Status | Check | Detail |");
        sb.AppendLine("|--------|-------|--------|");

        foreach (PilotPreflightStepResult step in report.Steps)
        {
            string icon = step.Disposition switch
            {
                PilotPreflightDisposition.Pass => "✅ PASS",
                PilotPreflightDisposition.Warn => "⚠️ WARN",
                _ => "❌ BLOCK",
            };

            string detail = step.Detail.Replace("|", "\\|");
            sb.AppendLine($"| {icon} | `{step.Name}` | {detail} |");
        }

        sb.AppendLine();

        IEnumerable<PilotPreflightStepResult> remediations =
            report.Steps.Where(static s => !string.IsNullOrWhiteSpace(s.Remediation));

        if (remediations.Any())
        {
            sb.AppendLine("## Owner Next Steps");
            sb.AppendLine();

            foreach (PilotPreflightStepResult step in remediations)
            {
                sb.AppendLine($"### `{step.Name}`");
                sb.AppendLine();
                sb.AppendLine(step.Remediation);
                sb.AppendLine();
            }
        }

        sb.AppendLine("## References");
        sb.AppendLine();
        sb.AppendLine("- **Pilot runbook:** `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`");
        sb.AppendLine("- **Configuration reference:** `docs/library/CONFIGURATION_REFERENCE.md`");
        sb.AppendLine("- **Extractor upload limits:** `docs/library/CONFIGURATION_REFERENCE.md` §Extractor");
        sb.AppendLine("- **ITSM health:** `GET /v1/integrations/itsm/health` (include with `--include-itsm`)");
        sb.AppendLine();

        if (report.AllBlockingPassed)
        {
            sb.AppendLine("> **Ready for first pilot.** Address any WARN rows before a production launch.");
        }
        else
        {
            sb.AppendLine(
                "> **Not ready for first pilot.** Fix all BLOCK rows above, then re-run `archlucid pilot preflight`.");
        }

        return sb.ToString();
    }
}

