using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Console entry point for the full-operator review API harness.</summary>
[ExcludeFromCodeCoverage(Justification = "Console I/O glue; covered via options/parser/validator/runner unit tests.")]
public static class Program
{
    private static readonly JsonSerializerOptions ReportJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public static async Task<int> Main(string[] args)
    {
        if (args.Length == 0 || IsHelp(args))
        {
            JourneyOptionsParser.WriteUsage(Console.Out);
            return HarnessExitCode.UsageError;
        }

        JourneyOptions? options = JourneyOptionsParser.Parse(args, out string? error);

        if (options is null)
        {
            if (!string.IsNullOrWhiteSpace(error))
                await Console.Error.WriteLineAsync(error);

            JourneyOptionsParser.WriteUsage(Console.Out);
            return HarnessExitCode.UsageError;
        }

        string snapshotPath = string.IsNullOrWhiteSpace(options.OpenApiSnapshotPath)
            ? OpenApiContractCatalog.ResolveDefaultSnapshotPath()
            : options.OpenApiSnapshotPath!;

        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(snapshotPath);

        using HttpClient http = HarnessHttpClientFactory.Create(options);
        OperatorReviewJourneyRunner runner = new(http, options, catalog);
        JourneyReport report = await runner.RunAsync();

        string reportJson = JsonSerializer.Serialize(report, ReportJson);

        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
        {
            string? directory = Path.GetDirectoryName(Path.GetFullPath(options.JsonOutPath));

            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(options.JsonOutPath, reportJson);
        }

        WriteHumanReport(options.ApiBaseUrl, report);

        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            Console.WriteLine($"Wrote JSON report: {options.JsonOutPath}");

        return report.AllPassed ? HarnessExitCode.Success : HarnessExitCode.OperationFailed;
    }

    private static bool IsHelp(string[] args)
    {
        return args.Any(static a =>
            string.Equals(a, "--help", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(a, "-h", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(a, "/?", StringComparison.OrdinalIgnoreCase));
    }

    private static void WriteHumanReport(string baseUrl, JourneyReport report)
    {
        Console.WriteLine($"ArchLucid.ReviewApiHarness @ {baseUrl}");
        Console.WriteLine(new string('-', 72));

        foreach (JourneyStepResult step in report.Steps)
        {
            string verdict = step.Passed ? "PASS" : "FAIL";
            Console.WriteLine(
                $"[{verdict}] {step.Name,-28} {step.ElapsedMilliseconds,8} ms  {step.Detail}");

            if (!step.Passed && !string.IsNullOrWhiteSpace(step.FailureHint))
                Console.WriteLine($"        hint: {step.FailureHint}");

            foreach (string validationError in step.ValidationErrors.Take(12))
                Console.WriteLine($"        validate: {validationError}");

            if (step.ValidationErrors.Count > 12)
                Console.WriteLine($"        validate: … {step.ValidationErrors.Count - 12} more");
        }

        Console.WriteLine(new string('-', 72));
        Console.WriteLine(
            $"total={report.TotalElapsedMilliseconds} ms  runId={report.RunId ?? "<none>"}  " +
            $"status={report.FinalRunStatus ?? "<none>"}  mode={report.StructuralExecutionMode ?? "<none>"}  " +
            $"tokens={report.TotalLlmTokens}  manifest={report.ManifestVersion ?? "<none>"}  " +
            $"approval={report.ApprovalRequestId ?? "<none>"}  correlation={report.CorrelationId ?? "<none>"}");
        Console.WriteLine(report.AllPassed ? "PASS" : "FAIL");
    }
}
