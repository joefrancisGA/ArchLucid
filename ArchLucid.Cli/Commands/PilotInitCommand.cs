using System.Diagnostics.CodeAnalysis;

using Spectre.Console;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Guided interactive pilot pre-flight (<c>archlucid pilot init</c>).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Console prompts and ANSI rendering.")]
internal static class PilotInitCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Interactive pilot init does not support the leading global --json flag; use --out for the report file.");

            return CliExitCode.UsageError;
        }

        if (!PilotInitOptions.TryParse(args, out PilotInitOptions? options, out string? parseError))
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + parseError);
            WriteUsage();

            return CliExitCode.UsageError;
        }

        ArgumentNullException.ThrowIfNull(options);

        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(options.BaseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        AnsiConsole.Write(
            new Panel(
                    "[bold]ArchLucid pilot init[/] — guided pre-flight for production-like hosted pilots.\n"
                    + "Checks: API health/ready · config lint (production-like-hosted-pilot) · token roles · optional Azure OpenAI smoke.")
                .Border(BoxBorder.Rounded));

        AnsiConsole.MarkupLine($"Target API: [gray]{Markup.Escape(options.BaseUrl)}[/]");

        PilotInitOptions resolved = await ResolveInteractiveOptionsAsync(options, cancellationToken).ConfigureAwait(false);

        PilotInitReportDocument? report = null;

        await AnsiConsole.Status()
            .Spinner(Spinner.Known.Dots)
            .StartAsync("Running pilot pre-flight checks…", async _ =>
            {
                using HttpClient http = CliAuthorizedHttpClient.Create(resolved.BaseUrl);
                PilotInitOrchestrator orchestrator = new(http);
                report = await orchestrator
                    .RunAsync(resolved, localConfigurationOverride: null, cancellationToken)
                    .ConfigureAwait(false);
            });

        ArgumentNullException.ThrowIfNull(report);

        await PilotInitReportBuilder
            .WriteReportAsync(report, resolved.ReportOutputPath, cancellationToken)
            .ConfigureAwait(false);

        RenderHumanSummary(report, resolved.ReportOutputPath);

        return string.Equals(report.OverallDisposition, "PASS", StringComparison.Ordinal)
            ? CliExitCode.Success
            : CliExitCode.OperationFailed;
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot init [--api-base-url <url>] [--simulate-production] [--local-lab] "
            + "[--bearer <jwt>] [--skip-token-test] [--openai-smoke] [--skip-openai-smoke] [--out <path>]");
        Console.WriteLine();
        Console.WriteLine("Writes pilot-preflight-report.json with PASS/HOLD disposition and numbered fix steps.");
        Console.WriteLine("Docs: docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md · docs/library/CONFIGURATION_REFERENCE.md");
    }

    private static async Task<PilotInitOptions> ResolveInteractiveOptionsAsync(
        PilotInitOptions options,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        string? bearerToken = options.BearerToken;
        bool skipTokenTest = options.SkipTokenTest;
        bool runOpenAiSmoke = options.RunOpenAiSmoke;

        if (!skipTokenTest && string.IsNullOrWhiteSpace(bearerToken))
        {
            bool runTokenTest = AnsiConsole.Confirm(
                "Run JWT role-claim diagnostic (auth test-token)?",
                defaultValue: true);

            if (runTokenTest)
            {
                bearerToken = AnsiConsole.Prompt(
                    new TextPrompt<string>("Paste bearer JWT [dim](hidden; leave blank to skip)[/]")
                        .PromptStyle("gray")
                        .Secret());
            }
            else
            {
                skipTokenTest = true;
            }
        }

        if (options.SimulateProduction)
        {
            runOpenAiSmoke = AnsiConsole.Confirm(
                "Probe Azure OpenAI endpoint reachability (Real mode only)?",
                defaultValue: runOpenAiSmoke);
        }

        await Task.CompletedTask.ConfigureAwait(false);

        return new PilotInitOptions
        {
            BaseUrl = options.BaseUrl,
            SimulateProduction = options.SimulateProduction,
            BearerToken = bearerToken,
            SkipTokenTest = skipTokenTest,
            RunOpenAiSmoke = runOpenAiSmoke,
            ReportOutputPath = options.ReportOutputPath,
        };
    }

    private static void RenderHumanSummary(PilotInitReportDocument report, string reportPath)
    {
        Console.WriteLine();
        Console.WriteLine($"archlucid pilot init @ {report.BaseUrl}");
        Console.WriteLine(new string('-', 60));

        foreach (PilotPreflightStepResult step in report.Checks)
        {
            string label = step.Disposition switch
            {
                PilotPreflightDisposition.Pass => "PASS",
                PilotPreflightDisposition.Warn => "WARN",
                _ => "BLOCK",
            };

            Console.WriteLine($"[{label}] {step.Name,-28} {step.Detail}");
        }

        Console.WriteLine(new string('-', 60));

        string headline = string.Equals(report.OverallDisposition, "PASS", StringComparison.Ordinal)
            ? $"PASS — {report.WarningCount} warning(s), {report.BlockingCount} blocking failure(s)."
            : $"HOLD — {report.BlockingCount} blocking failure(s), {report.WarningCount} warning(s).";

        Console.WriteLine(headline);
        Console.WriteLine($"Report: {reportPath}");

        if (report.FixSteps.Count == 0)
            return;

        Console.WriteLine();
        Console.WriteLine("Numbered fix steps:");

        foreach (PilotInitFixStep fixStep in report.FixSteps)
            Console.WriteLine($"{fixStep.StepNumber}. [{fixStep.CheckName}] {fixStep.Remediation}");
    }
}
