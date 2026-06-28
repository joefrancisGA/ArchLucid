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

        string artifactKey = DecisionOwnerScoreboardOutputPaths.ResolveArtifactKey(report);
        DecisionOwnerScoreboardOutputResolution outputPaths =
            DecisionOwnerScoreboardOutputPaths.Resolve(options, repositoryRoot, artifactKey);
        DecisionOwnerScoreboardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath,
            outputPaths.SponsorMarkdownPath);

        string json = JsonSerializer.Serialize(finalReport, JsonOptions);

        WriteArtifacts(outputPaths, json, finalReport.OperatorMarkdown, finalReport.SponsorMarkdown);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(json);
        }
        else
        {
            WriteConsoleSummary(finalReport);
            Console.WriteLine();
            Console.WriteLine(finalReport.OperatorMarkdown);
        }

        return Task.FromResult(finalReport.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success);
    }

    private static void WriteArtifacts(
        DecisionOwnerScoreboardOutputResolution outputPaths,
        string json,
        string operatorMarkdown,
        string sponsorMarkdown)
    {
        if (outputPaths.WillWriteJson)
        {
            string jsonDirectory = Path.GetDirectoryName(outputPaths.JsonPath!)!;

            if (!Directory.Exists(jsonDirectory))
                Directory.CreateDirectory(jsonDirectory);

            File.WriteAllText(outputPaths.JsonPath!, json, Encoding.UTF8);
        }

        if (outputPaths.WillWriteMarkdown)
        {
            string markdownDirectory = Path.GetDirectoryName(outputPaths.MarkdownPath!)!;

            if (!Directory.Exists(markdownDirectory))
                Directory.CreateDirectory(markdownDirectory);

            File.WriteAllText(outputPaths.MarkdownPath!, operatorMarkdown, Encoding.UTF8);
        }

        if (outputPaths.WillWriteSponsorMarkdown)
        {
            string sponsorDirectory = Path.GetDirectoryName(outputPaths.SponsorMarkdownPath!)!;

            if (!Directory.Exists(sponsorDirectory))
                Directory.CreateDirectory(sponsorDirectory);

            File.WriteAllText(outputPaths.SponsorMarkdownPath!, sponsorMarkdown, Encoding.UTF8);
        }
    }

    private static void WriteConsoleSummary(DecisionOwnerScoreboardReport report)
    {
        Console.WriteLine("archlucid pilot decision-owner-scoreboard");
        Console.WriteLine($"repo: {report.RepositoryRoot}");
        Console.WriteLine($"ledger: {report.LedgerDirectory}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");

        if (!string.IsNullOrWhiteSpace(report.JsonArtifactPath))
            Console.WriteLine($"json artifact: {report.JsonArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.MarkdownArtifactPath))
            Console.WriteLine($"markdown artifact: {report.MarkdownArtifactPath}");

        if (!string.IsNullOrWhiteSpace(report.SponsorMarkdownArtifactPath))
            Console.WriteLine($"sponsor markdown artifact: {report.SponsorMarkdownArtifactPath}");

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
            + "[--json-out <path>] [--markdown-out <path>] [--sponsor-markdown-out <path>] [--no-write-artifacts] [--json]");
    }
}
