using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;


namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static Task<int> HandleExplainOperatorModel(string[] normalized) =>
        ExplainOperatorModelCommand.RunAsync();


    internal static Task<int> HandleSecondRun(string[] normalized) =>
        SecondRunCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleRequest(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "create", StringComparison.OrdinalIgnoreCase))
            return await RequestCreateCommand.RunAsync(normalized.Skip(2).ToArray());

        RequestCreateCommand.WriteUsage();

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleDraft(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "new", StringComparison.OrdinalIgnoreCase))
            return await DraftNewCommand.RunAsync(normalized.Skip(2).ToArray());

        DraftNewCommandOptions.WriteUsage();

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleTrial(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "smoke")
            return await TrialSmokeCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine(
            "Usage: archlucid trial smoke --org <name> --email <email> [--display-name <name>] " +
            "[--baseline-hours <n>] [--baseline-source <text>] [--api-base-url <url>] [--skip-pilot-run-deltas] [--staging] [--one-line]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleRealMode(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "smoke", StringComparison.OrdinalIgnoreCase))
            return await RealModeSmokeCommand.RunAsync(normalized.Skip(2).ToArray());

        RealModeSmokeCommand.WriteUsage();

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleRoiBulletin(string[] normalized) =>
        RoiBulletinCommand.RunAsync(normalized.Skip(1).ToArray());

    internal static async Task<int> HandleRoi(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "export", StringComparison.OrdinalIgnoreCase))
            return await RoiExportCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "board-pack", StringComparison.OrdinalIgnoreCase))
            return await RoiBoardPackCommand.RunAsync(normalized.Skip(2).ToArray());

        RoiExportCommand.WriteUsage();
        RoiBoardPackCommand.WriteUsage();

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleCompliance(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "export-drift", StringComparison.OrdinalIgnoreCase))
            return await ComplianceExportDriftCommand.RunAsync(normalized.Skip(2).ToArray());

        ComplianceExportDriftCommand.WriteUsage();

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleAgentEval(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "rollup", StringComparison.OrdinalIgnoreCase))
            return await AgentEvalRollupCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine("Usage: archlucid agent-eval rollup --from-json <agent-evaluation.json> [--json]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleRealLlmEvidence(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "summarize", StringComparison.OrdinalIgnoreCase))
            return await RealLlmEvidenceSummarizeCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine("Usage: archlucid real-llm-evidence summarize --from-json <path>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSecurityTrust(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "publish")
            return await SecurityTrustPublishCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine(
            "Usage: archlucid security-trust publish --kind pen-test --date <YYYY-MM-DD> "
            + "--summary-url <URL> [--assessor <name>] [--assessment-code <code>] [--ui-base-url <url>]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleMarketplace(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "preflight")
            return await MarketplacePreflightCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine("Usage: archlucid marketplace preflight [--repo <dir>]");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleProcurementPack(string[] normalized) =>
        ProcurementPackCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleBuyerProofPack(string[] normalized) =>
        BuyerProofPackCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleProofPacket(string[] normalized) =>
        ProofPacketCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleSponsorPacket(string[] normalized) =>
        SponsorPacketCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleFirstValueReport(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            bool saveReport = normalized.Skip(2).Contains("--save", StringComparer.Ordinal);

            return await FirstValueReportCommand.RunAsync(normalized[1], saveReport);
        }

        Console.WriteLine("Usage: archlucid first-value-report <runId> [--save]");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSponsorOnePager(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            bool savePdf = normalized.Skip(2).Contains("--save", StringComparer.Ordinal);

            return await SponsorOnePagerCommand.RunAsync(normalized[1], savePdf);
        }

        Console.WriteLine("Usage: archlucid sponsor-one-pager <runId> [--save]");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleReferenceEvidence(string[] normalized) =>
        ReferenceEvidenceCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleCostEstimate(string[] normalized)
    {
        if (normalized.Length > 1)
            return await CostEstimateCommand.RunAsync(normalized.Skip(1).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid cost-estimate [--live-pricing] <manifest.json|extractor.zip>");
        else
            Console.WriteLine("Usage: archlucid cost-estimate [--live-pricing] <manifest.json|extractor.zip>");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleDataConsistency(string[] normalized) =>
        DataConsistencyCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleHealth(string[] normalized) =>
        HealthCommand.RunAsync();


    internal static Task<int> HandleValidateConfig(string[] normalized) =>
        ValidateConfigCommand.RunAsync(
            normalized
                .Skip(1)
                .ToArray());


    internal static Task<int> HandleComplianceReport(string[] normalized) =>
        ComplianceReportCommand.RunAsync(
            normalized
                .Skip(1)
                .ToArray());


    internal static Task<int> HandleOnboardPreflight(string[] normalized) =>
        OnboardPreflightCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleStack(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "init", StringComparison.Ordinal))
            return await StackInitCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "diff", StringComparison.Ordinal))
            return await StackDiffCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "doctor", StringComparison.Ordinal))
            return await StackDoctorCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine(
            "Usage: archlucid stack init [--from-example] [--answers <path>] [--out <dir>] [--force] [--repo-root <dir>] | archlucid stack diff [--answers <path>] [--out <dir>] [--repo-root <dir>] | archlucid stack doctor [--profile FirstPilotMinimum|StagingRealLlm|ProductionLike|staging-deploy|post-deploy] [--answers <path>] [--api-base-url <url>] [--json]");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleDoctor(string[] normalized) =>
        DoctorCommand.RunAsync(CliCommandShared.TryLoadConfigFromCwd());


    internal static Task<int> HandleDeploymentEvidence(string[] normalized) =>
        DeploymentEvidenceCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleDocs(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "pdf", StringComparison.Ordinal)
            && string.Equals(normalized[2], "render", StringComparison.Ordinal))
            return await DocsPdfRenderCommand.RunAsync(normalized.Skip(3).ToArray());

        Console.WriteLine(
            "Usage: archlucid docs pdf render --markdown <path.md> --metadata <metadata.json> --out <path.pdf>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSupport(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "incident-readiness-drill", StringComparison.OrdinalIgnoreCase))
            return await SupportIncidentReadinessDrillCommand.RunAsync(normalized.Skip(2).ToArray());

        Console.WriteLine("Usage: archlucid support incident-readiness-drill --out <directory>");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleSupportBundle(string[] normalized) =>
        SupportBundleCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleCompletions(string[] normalized) =>
        CompletionsCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static async Task<int> HandleConfig(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "check", StringComparison.Ordinal))

            return await ConfigCheckCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "lint", StringComparison.Ordinal))

            return await ConfigLintCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "bootstrap", StringComparison.Ordinal))

            return await ConfigBootstrapCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid config check [--no-api] | archlucid config lint [--simulate-production] [--hosting-advisor] [--profile production-like-hosted-pilot] [--json] [--json-out <path>] [--markdown-out <path>] | archlucid config bootstrap [--out <path>] [--force]");
        else
            Console.WriteLine(
                "Usage: archlucid config check [--no-api] · archlucid config lint [--simulate-production] [--hosting-advisor] [--profile production-like-hosted-pilot] [--json] [--json-out <path>] [--markdown-out <path>] · archlucid config bootstrap [--out <path>] [--force]");

        return CliExitCode.UsageError;
    }


    private static void WriteNewUsage()
    {
        string plain =
            "Usage: archlucid new <projectName>" + Environment.NewLine
            + "  Creates archlucid.json, inputs/brief.md, outputs/, and docs/README.md in a new project folder.";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }


    private static bool TryParseNewCommandArgs(
        string[] args,
        [NotNullWhen(true)] out string? projectName)
    {
        projectName = null;

        if (args.Length == 0)
            return false;

        List<string> positionals = [];

        foreach (string arg in args)
        {
            if (arg.StartsWith('-'))
                return false;

            positionals.Add(arg);
        }

        if (positionals.Count != 1)
            return false;

        projectName = positionals[0];

        return true;
    }
}
