using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class BuyerProofEvidenceLedgerCommand
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

        BuyerProofEvidenceLedgerOptions options;

        try
        {
            options = BuyerProofEvidenceLedgerOptions.Parse(args);
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

        BuyerProofEvidenceLedgerRules rules = BuyerProofEvidenceLedgerRulesLoader.Load(options.RulesPath);
        BuyerProofEvidenceLedgerRunner runner = new();
        BuyerProofEvidenceLedgerReport report = runner.Run(repositoryRoot, options, rules);

        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = BuildMarkdown(report);

        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            File.WriteAllText(options.JsonOutPath, json, Encoding.UTF8);

        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            File.WriteAllText(options.MarkdownOutPath, markdown, Encoding.UTF8);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(json);
        }
        else
        {
            WriteConsoleSummary(report);
            Console.WriteLine();
            Console.WriteLine(markdown);
        }

        return Task.FromResult(report.AnyFail ? CliExitCode.OperationFailed : CliExitCode.Success);
    }

    private static void WriteConsoleSummary(BuyerProofEvidenceLedgerReport report)
    {
        Console.WriteLine("archlucid pilot buyer-proof-evidence-ledger");
        Console.WriteLine($"repo: {report.RepositoryRoot}");
        Console.WriteLine($"proof: {report.ProofDirectory}");
        Console.WriteLine($"overall: {FormatVerdict(report.OverallVerdict)}");
        Console.WriteLine(new string('-', 72));

        foreach (BuyerProofEvidenceLedgerCheckResult check in report.Checks)
        {
            Console.WriteLine($"[{FormatVerdict(check.Verdict)}] {check.Name}");
            Console.WriteLine($"        evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                Console.WriteLine($"        next: {check.Resolution}");
        }
    }

    private static string BuildMarkdown(BuyerProofEvidenceLedgerReport report)
    {
        StringBuilder sb = new();

        sb.AppendLine("# Buyer-proof evidence ledger normalization");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Repository: `{report.RepositoryRoot}`");
        sb.AppendLine($"Proof directory: `{report.ProofDirectory}`");
        sb.AppendLine($"Overall verdict: **{FormatVerdict(report.OverallVerdict)}**");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(report.RunId))
            sb.AppendLine($"- Run id: `{report.RunId}`");

        if (!string.IsNullOrWhiteSpace(report.RoiBasisStatus))
        {
            sb.AppendLine(
                $"- ROI basis: **{report.RoiBasisStatus}** (sponsor-safe: {report.RoiSponsorSafe?.ToString(CultureInfo.InvariantCulture) ?? "unknown"})");
        }

        if (!string.IsNullOrWhiteSpace(report.SponsorPacketDisposition))
            sb.AppendLine($"- Sponsor packet disposition: **{report.SponsorPacketDisposition}**");

        sb.AppendLine();
        sb.AppendLine("## Normalized proof-completion slots");
        sb.AppendLine();
        sb.AppendLine("| Slot | Status | Verdict | Evidence |");
        sb.AppendLine("| --- | --- | --- | --- |");

        foreach (BuyerProofEvidenceLedgerSlotStatus slot in report.NormalizedSlots)
        {
            sb.AppendLine(
                $"| {slot.Label} | {slot.NormalizedStatus} | {FormatVerdict(slot.Verdict)} | {slot.Evidence.Replace('|', '/')} |");
        }

        sb.AppendLine();
        sb.AppendLine("## Checks");
        sb.AppendLine();

        foreach (BuyerProofEvidenceLedgerCheckResult check in report.Checks)
        {
            sb.AppendLine($"### {check.Name} — {FormatVerdict(check.Verdict)}");
            sb.AppendLine($"- Evidence: {check.Evidence}");

            if (!string.IsNullOrWhiteSpace(check.Resolution))
                sb.AppendLine($"- Next: {check.Resolution}");

            sb.AppendLine();
        }

        sb.AppendLine("## Notes");
        sb.AppendLine();
        sb.AppendLine("- Maps heterogeneous proof artifacts to one canonical sponsor-send completion matrix.");
        sb.AppendLine("- Non-zero exit when required sponsor-send slots fail or canonical fixture assets are missing.");

        return sb.ToString();
    }

    private static string FormatVerdict(BuyerProofEvidenceLedgerVerdict verdict)
    {
        return verdict switch
        {
            BuyerProofEvidenceLedgerVerdict.Pass => "PASS",
            BuyerProofEvidenceLedgerVerdict.Warn => "WARN",
            BuyerProofEvidenceLedgerVerdict.Fail => "FAIL",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown buyer-proof evidence ledger verdict."),
        };
    }

    internal static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid pilot buyer-proof-evidence-ledger [--proof-dir <path>] [--rules <path>] "
            + "[--json-out <path>] [--markdown-out <path>] [--json]");
    }
}
