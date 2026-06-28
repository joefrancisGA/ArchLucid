using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class DecisionOwnerScoreboardCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    public static Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        DecisionOwnerScoreboardOptions options;

        try
        {
            options = DecisionOwnerScoreboardOptions.Parse(args);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            WriteUsage();

            return Task.FromResult(CliExitCode.UsageError);
        }

        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        if (repositoryRoot is null)
        {
            Console.Error.WriteLine("[ArchLucid CLI] Could not resolve repository root. Run from the ArchLucid repo.");

            return Task.FromResult(CliExitCode.ConfigurationError);
        }

        DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(options.RulesPath);
        DecisionOwnerScoreboardRunner runner = new();
        DecisionOwnerScoreboardReport report = runner.Run(repositoryRoot, options, rules);

        string json = JsonSerializer.Serialize(report, JsonOptions);

        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            File.WriteAllText(options.JsonOutPath, json, Encoding.UTF8);

        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            File.WriteAllText(options.MarkdownOutPath, report.OperatorMarkdown, Encoding.UTF8);

        if (!string.IsNullOrWhiteSpace(options.SponsorMarkdownOutPath))
            File.WriteAllText(options.SponsorMarkdownOutPath, report.SponsorMarkdown, Encoding.UTF8);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(json);
        }
        else
        {
            WriteConsoleSummary(report);
            Console.WriteLine();
            Console.WriteLine(report.OperatorMarkdown);
        }

        return Task.FromResult(report.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success);
    }

    private static void WriteConsoleSummary(DecisionOwnerScoreboardReport report)
    {
        Console.WriteLine("archlucid pilot decision-owner-scoreboard");
        Console.WriteLine($"repo: {report.RepositoryRoot}");
        Console.WriteLine($"ledger: {report.LedgerDirectory}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");
        Console.WriteLine(new string('-', 72));

        foreach (DecisionOwnerScoreboardCheckResult check in report.Checks)
        {
            Console.WriteLine($"[{FormatVerdict(check.Verdict)}] {check.Name}");
            Console.WriteLine($"        evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                Console.WriteLine($"        next: {check.Resolution}");
        }
    }

    private static string FormatVerdict(DecisionOwnerScoreboardVerdict verdict)
    {
        return verdict switch
        {
            DecisionOwnerScoreboardVerdict.Pass => "PASS",
            DecisionOwnerScoreboardVerdict.Warn => "WARN",
            DecisionOwnerScoreboardVerdict.Fail => "FAIL",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown decision-owner scoreboard verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot decision-owner-scoreboard [--ledger-dir <path>] [--rules <path>] "
            + "[--json-out <path>] [--markdown-out <path>] [--sponsor-markdown-out <path>] [--json]");
    }
}
