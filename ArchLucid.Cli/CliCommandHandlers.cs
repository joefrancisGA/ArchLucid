using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli;

/// <summary>
///     Top-level CLI command handlers extracted from <see cref="Program" /> dispatch.
/// </summary>
internal static class CliCommandHandlers
{
    internal static async Task<int> HandleNew(string[] normalized)
    {
        if (normalized.Skip(1).Any(static a =>
                string.Equals(a, "--quickstart", StringComparison.OrdinalIgnoreCase)))
        {
            const string quickstartMessage =
                "--quickstart is not supported. Use archlucid new <name> and set apiUrl in archlucid.json or ARCHLUCID_API_URL.";

            if (CliExecutionContext.JsonOutput)
                CliJson.WriteFailureLine(
                    Console.Error,
                    CliExitCode.UsageError,
                    "usage",
                    quickstartMessage);
            else
                Console.WriteLine(quickstartMessage);

            return CliExitCode.UsageError;
        }

        if (TryParseNewCommandArgs(normalized.Skip(1).ToArray(), out string? projectName))
            return await NewCommand.RunAsync(projectName);

        WriteNewUsage();

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandlePilot(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            if (normalized[1] == "up")
            {
                const string pilotUpRemoved =
                    "pilot up is not available in the product CLI (local Docker bring-up is contributor-only). Set ARCHLUCID_API_URL to your hosted API instead.";

                if (CliExecutionContext.JsonOutput)
                    CliJson.WriteFailureLine(
                        Console.Error,
                        CliExitCode.UsageError,
                        "usage",
                        pilotUpRemoved);
                else
                    Console.WriteLine(pilotUpRemoved);

                return CliExitCode.UsageError;
            }

            if (normalized[1] == "success-criteria-template")
                return await PilotSuccessCriteriaTemplateCommand.RunAsync();

            if (normalized[1] == "preflight")
                return await PilotPreflightCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "init")
                return await PilotInitCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "proof")
                return await PilotProofCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "proof-packet")
                return await PilotProofPacketCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "ship-gate-evidence")
                return await ShipGateEvidenceCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "frontier-ai-baseline")
                return await FrontierAiBaselineCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "itsm-pull-forward-gate")
                return await ItsmPullForwardCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "citation-integrity")
                return await CitationIntegrityCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "tenant-isolation-negative-test")
                return await TenantIsolationNegativeTestCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "return-trigger-telemetry")
                return await ReturnTriggerTelemetryCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "buyer-proof-evidence-ledger")
                return await BuyerProofEvidenceLedgerCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "decision-owner-scoreboard")
                return await DecisionOwnerScoreboardCommand.RunAsync(normalized.Skip(2).ToArray());

            if (normalized[1] == "readiness-bundle")
                return await PilotReadinessBundleCommand.RunAsync(normalized.Skip(2).ToArray());
        }

        Console.WriteLine("Expected: archlucid pilot init | archlucid pilot success-criteria-template | archlucid pilot preflight [--no-api] [--include-itsm] [--simulate-production] [--md] [--markdown-out <path>] | archlucid pilot proof [-- args for collect-first-pilot-proof.ps1] | archlucid pilot proof-packet <runId> [--out <dir>] | archlucid pilot ship-gate-evidence --run-id <guid> [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] [--ui-base-url <url>] | archlucid pilot frontier-ai-baseline [--scoreboard <path>] [--init-scoreboard] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot itsm-pull-forward-gate [--ledger-dir <path>] [--evidence <path>] [--include-api] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot citation-integrity [--fixtures-dir <path>] [--manifest <path>] [--sample-size <n>] [--fail-threshold <n>] [--include-api] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot tenant-isolation-negative-test [--run-id <guid>] [--alternate-tenant-id <guid>] [--alternate-workspace-id <guid>] [--alternate-project-id <guid>] [--manifest <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot return-trigger-telemetry [--ledger-dir <path>] [--rules <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot buyer-proof-evidence-ledger [--proof-dir <path>] [--rules <path>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts] | archlucid pilot decision-owner-scoreboard [--ledger-dir <path>] [--rules <path>] [--json-out <path>] [--markdown-out <path>] [--sponsor-markdown-out <path>] [--no-write-artifacts] | archlucid pilot readiness-bundle [--run-id <guid>] [--include-api] [--ui-base-url <url>] [--json-out <path>] [--markdown-out <path>] [--no-write-artifacts]");

        return CliExitCode.UsageError;
    }

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

    internal static async Task<int> HandleAuth(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "validate-saml", StringComparison.OrdinalIgnoreCase))
            return await AuthValidateSamlCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "diagnostics", StringComparison.OrdinalIgnoreCase))
            return await AuthDiagnosticsCommand.RunAsync(
                normalized.Skip(2).ToArray(),
                CliCommandShared.TryLoadConfigFromCwd());

        if (normalized.Length > 1 && string.Equals(normalized[1], "test-token", StringComparison.OrdinalIgnoreCase))
            return await AuthTestTokenCommand.RunAsync(
                normalized.Skip(2).ToArray(),
                CliCommandShared.TryLoadConfigFromCwd());

        if (normalized.Length > 1 && string.Equals(normalized[1], "sso-preflight", StringComparison.OrdinalIgnoreCase))
            return await AuthSsoPreflightCommand.RunAsync();

        AuthValidateSamlCommand.WriteUsage();
        AuthDiagnosticsCommand.WriteUsage();
        AuthTestTokenCommand.WriteUsage();
        AuthSsoPreflightCommand.WriteUsage();

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleIntegration(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            if (string.Equals(normalized[1], "retry-dead-letter", StringComparison.OrdinalIgnoreCase))
                return await IntegrationRetryDeadLetterCommand.RunAsync(normalized.Skip(2).ToArray());

            if (string.Equals(normalized[1], "simulate-webhook", StringComparison.OrdinalIgnoreCase))
                return await IntegrationSimulateWebhookCommand.RunAsync(normalized.Skip(2).ToArray());
        }

        IntegrationRetryDeadLetterCommand.WriteUsage();
        Console.WriteLine("       archlucid integration simulate-webhook --event-type <alias> --target-url <url> [--secret <s>]");

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

    internal static async Task<int> HandleAzure(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "extract-and-upload", StringComparison.OrdinalIgnoreCase))
            return await AzureExtractAndUploadCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 2
            && string.Equals(normalized[1], "terraform-export", StringComparison.OrdinalIgnoreCase))
            return await AzureTerraformExportCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 2
            && string.Equals(normalized[1], "validate-zip", StringComparison.OrdinalIgnoreCase))
            return await AzureValidateZipCommand.RunAsync(normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid azure terraform-export ... | archlucid azure validate-zip --path <file.zip> | archlucid azure extract-and-upload --subscription <id>");
        else
        {
            Console.WriteLine(
                "Usage: archlucid azure terraform-export --subscription <subId> --resource-group <name> --out <bundle.zip>");
            Console.WriteLine("       archlucid azure validate-zip --path <file.zip>");
            Console.WriteLine("       archlucid azure extract-and-upload --subscription <id>");
        }

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleAws(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "validate-zip", StringComparison.OrdinalIgnoreCase))
            return await CloudInventoryValidateZipCommand.RunAsync(CloudProvider.Aws, normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid aws validate-zip --path <file.zip>");
        else
            Console.WriteLine("Usage: archlucid aws validate-zip --path <file.zip>");

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleGcp(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "validate-zip", StringComparison.OrdinalIgnoreCase))
            return await CloudInventoryValidateZipCommand.RunAsync(CloudProvider.Gcp, normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid gcp validate-zip --path <file.zip>");
        else
            Console.WriteLine("Usage: archlucid gcp validate-zip --path <file.zip>");

        return CliExitCode.UsageError;
    }

    internal static Task<int> HandleAzRoles(string[] normalized) =>
        AzRolesCommand.RunAsync(normalized.Skip(1).ToArray());

    internal static Task<int> HandleAzTokenTest(string[] normalized) =>
        AzureTokenTestCommand.RunAsync();

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

    internal static async Task<int> HandleRun(string[] normalized)
    {
        if (normalized.Contains("--quick"))
        {
            const string quickRemoved =
                "run --quick is not supported. Use archlucid run without --quick against your hosted API.";

            if (CliExecutionContext.JsonOutput)
                CliJson.WriteFailureLine(
                    Console.Error,
                    CliExitCode.UsageError,
                    "usage",
                    quickRemoved);
            else
                Console.WriteLine(quickRemoved);

            return CliExitCode.UsageError;
        }

        string? idempotencyKey = CliCommandShared.TryGetOptionValue(normalized, "--idempotency-key");

        return await RunCommand.RunAsync(idempotencyKey);
    }

    internal static async Task<int> HandleStatus(string[] normalized)
    {
        if (normalized.Length > 1)
            return await StatusCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid status <runId>");

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleTrace(string[] normalized)
    {
        if (normalized.Length > 1)
            return await TraceCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid trace <runId>");

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleRunSupportPacket(string[] normalized)
    {
        if (normalized.Length > 1)
            return await RunSupportPacketCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid run-support-packet <runId>");

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleSubmit(string[] normalized)
    {
        if (normalized.Length > 2)
            return await SubmitCommand.RunAsync(normalized[1], normalized[2]);

        Console.WriteLine("Usage: archlucid submit <runId> <result.json>");

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleCommit(string[] normalized)
    {
        if (normalized.Length > 1)
            return await CommitCommand.RunAsync(normalized[1]);

        Console.WriteLine("Usage: archlucid commit <runId>");

        return CliExitCode.UsageError;
    }

    internal static async Task<int> HandleArtifacts(string[] normalized)
    {
        if (normalized.Length <= 1)
        {
            Console.WriteLine("Usage: archlucid artifacts <runId> [--save]");

            return CliExitCode.UsageError;
        }

        bool saveArtifacts = normalized.Length > 2 && normalized[2] == "--save";

        return await ArtifactsCommand.RunAsync(normalized[1], saveArtifacts);
    }

    internal static Task<int> HandleComparisons(string[] normalized) =>
        ComparisonsCommand.RunAsync(normalized.Skip(1).ToArray());

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

    internal static async Task<int> HandleSaml(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "test-config", StringComparison.Ordinal))
            return await SamlTestConfigCommand.RunAsync();

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid saml test-config");
        else
            Console.WriteLine("Usage: archlucid saml test-config");

        return CliExitCode.UsageError;
    }

    internal static Task<int> HandleComplianceReport(string[] normalized) =>
        ComplianceReportCommand.RunAsync(
            normalized
                .Skip(1)
                .ToArray());

    internal static async Task<int> HandleWebhooks(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "test")
            return await WebhooksTestCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        WebhooksTestCommand.WriteUsage(false);

        return CliExitCode.UsageError;
    }

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
