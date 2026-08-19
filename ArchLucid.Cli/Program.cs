using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli;

[ExcludeFromCodeCoverage(Justification = "CLI dispatch and console I/O; tested via CLI integration tests.")]
public static class Program
{
    private static async Task<int> Main(string[] args)
    {
        return await RunAsync(args);
    }

    /// <summary>
    ///     Entry point for the CLI. Used by tests to assert exit codes and behavior.
    /// </summary>
    public static async Task<int> RunAsync(string[] args)
    {
        string[] normalized = CliExecutionContext.StripLeadingGlobalJsonFlags(args, out bool json);
        CliExecutionContext.JsonOutput = json;

        try
        {
            if (normalized.Length == 0 || IsRootHelpRequest(normalized))
            {
                WriteRootHelpMessage();

                return CliExitCode.UsageError;
            }

            string command = normalized[0];

            switch (command)
            {
                case "new":
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

                case "pilot":
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

                case "explain-operator-model":
                    return await ExplainOperatorModelCommand.RunAsync();

                case "second-run":
                    return await SecondRunCommand.RunAsync(normalized.Skip(1).ToArray());

                case "request":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "create", StringComparison.OrdinalIgnoreCase))
                        return await RequestCreateCommand.RunAsync(normalized.Skip(2).ToArray());

                    RequestCreateCommand.WriteUsage();

                    return CliExitCode.UsageError;

                case "draft":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "new", StringComparison.OrdinalIgnoreCase))
                        return await DraftNewCommand.RunAsync(normalized.Skip(2).ToArray());

                    DraftNewCommandOptions.WriteUsage();

                    return CliExitCode.UsageError;

                case "trial":
                    if (normalized.Length > 1 && normalized[1] == "smoke")
                        return await TrialSmokeCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine(
                        "Usage: archlucid trial smoke --org <name> --email <email> [--display-name <name>] " +
                        "[--baseline-hours <n>] [--baseline-source <text>] [--api-base-url <url>] [--skip-pilot-run-deltas] [--staging] [--one-line]");

                    return CliExitCode.UsageError;

                case "real-mode":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "smoke", StringComparison.OrdinalIgnoreCase))
                        return await RealModeSmokeCommand.RunAsync(normalized.Skip(2).ToArray());

                    RealModeSmokeCommand.WriteUsage();

                    return CliExitCode.UsageError;

                case "roi-bulletin":
                    return await RoiBulletinCommand.RunAsync(normalized.Skip(1).ToArray());

                case "roi":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "export", StringComparison.OrdinalIgnoreCase))
                        return await RoiExportCommand.RunAsync(normalized.Skip(2).ToArray());

                    if (normalized.Length > 1 && string.Equals(normalized[1], "board-pack", StringComparison.OrdinalIgnoreCase))
                        return await RoiBoardPackCommand.RunAsync(normalized.Skip(2).ToArray());

                    RoiExportCommand.WriteUsage();
                    RoiBoardPackCommand.WriteUsage();

                    return CliExitCode.UsageError;

                case "auth":
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

                case "integration":
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

                case "compliance":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "export-drift", StringComparison.OrdinalIgnoreCase))
                        return await ComplianceExportDriftCommand.RunAsync(normalized.Skip(2).ToArray());

                    ComplianceExportDriftCommand.WriteUsage();

                    return CliExitCode.UsageError;

                case "agent-eval":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "rollup", StringComparison.OrdinalIgnoreCase))
                        return await AgentEvalRollupCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine("Usage: archlucid agent-eval rollup --from-json <agent-evaluation.json> [--json]");

                    return CliExitCode.UsageError;

                case "real-llm-evidence":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "summarize", StringComparison.OrdinalIgnoreCase))
                        return await RealLlmEvidenceSummarizeCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine("Usage: archlucid real-llm-evidence summarize --from-json <path>");

                    return CliExitCode.UsageError;

                case "security-trust":
                    if (normalized.Length > 1 && normalized[1] == "publish")
                        return await SecurityTrustPublishCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine(
                        "Usage: archlucid security-trust publish --kind pen-test --date <YYYY-MM-DD> "
                        + "--summary-url <URL> [--assessor <name>] [--assessment-code <code>] [--ui-base-url <url>]");

                    return CliExitCode.UsageError;

                case "marketplace":
                    if (normalized.Length > 1 && normalized[1] == "preflight")
                        return await MarketplacePreflightCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine("Usage: archlucid marketplace preflight [--repo <dir>]");

                    return CliExitCode.UsageError;

                case "azure":
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

                case "aws":
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

                case "gcp":
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

                case "az-roles":
                    return await AzRolesCommand.RunAsync(normalized.Skip(1).ToArray());

                case "az-token-test":
                    return await AzureTokenTestCommand.RunAsync();

                case "manifest":
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

                case "golden-cohort":
                    if (normalized.Length > 1 && normalized[1] == "lock-baseline")
                        return await GoldenCohortLockBaselineCommand.RunAsync(normalized.Skip(2).ToArray());

                    if (normalized.Length > 1 && normalized[1] == "drift")
                        return await GoldenCohortDriftCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine(
                        "Usage: archlucid golden-cohort lock-baseline [--cohort <path>] [--write] | " +
                        "drift [--cohort <path>] [--strict-real] [--structural-only]");

                    return CliExitCode.UsageError;

                case "procurement-pack":
                    return await ProcurementPackCommand.RunAsync(normalized.Skip(1).ToArray());

                case "buyer-proof-pack":
                    return await BuyerProofPackCommand.RunAsync(normalized.Skip(1).ToArray());

                case "proof-packet":
                    return await ProofPacketCommand.RunAsync(normalized.Skip(1).ToArray());

                case "sponsor-packet":
                    return await SponsorPacketCommand.RunAsync(normalized.Skip(1).ToArray());

                case "first-value-report":
                    if (normalized.Length > 1)
                    {
                        bool saveReport = normalized.Skip(2).Contains("--save", StringComparer.Ordinal);

                        return await FirstValueReportCommand.RunAsync(normalized[1], saveReport);
                    }

                    Console.WriteLine("Usage: archlucid first-value-report <runId> [--save]");

                    return CliExitCode.UsageError;

                case "sponsor-one-pager":
                    if (normalized.Length > 1)
                    {
                        bool savePdf = normalized.Skip(2).Contains("--save", StringComparer.Ordinal);

                        return await SponsorOnePagerCommand.RunAsync(normalized[1], savePdf);
                    }

                    Console.WriteLine("Usage: archlucid sponsor-one-pager <runId> [--save]");

                    return CliExitCode.UsageError;

                case "reference-evidence":
                case "proof-pack":
                    return await ReferenceEvidenceCommand.RunAsync(normalized.Skip(1).ToArray());

                case "run":
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

                case "status":
                    if (normalized.Length > 1)
                        return await StatusCommand.RunAsync(normalized[1]);

                    Console.WriteLine("Usage: archlucid status <runId>");

                    return CliExitCode.UsageError;

                case "trace":
                    if (normalized.Length > 1)
                        return await TraceCommand.RunAsync(normalized[1]);

                    Console.WriteLine("Usage: archlucid trace <runId>");

                    return CliExitCode.UsageError;

                case "run-support-packet":
                    if (normalized.Length > 1)
                        return await RunSupportPacketCommand.RunAsync(normalized[1]);

                    Console.WriteLine("Usage: archlucid run-support-packet <runId>");

                    return CliExitCode.UsageError;

                case "submit":
                    if (normalized.Length > 2)
                        return await SubmitCommand.RunAsync(normalized[1], normalized[2]);

                    Console.WriteLine("Usage: archlucid submit <runId> <result.json>");

                    return CliExitCode.UsageError;

                case "commit":
                    if (normalized.Length > 1)
                        return await CommitCommand.RunAsync(normalized[1]);

                    Console.WriteLine("Usage: archlucid commit <runId>");

                    return CliExitCode.UsageError;

                case "artifacts":
                    if (normalized.Length <= 1)
                    {
                        Console.WriteLine("Usage: archlucid artifacts <runId> [--save]");

                        return CliExitCode.UsageError;
                    }

                    bool saveArtifacts = normalized.Length > 2 && normalized[2] == "--save";

                    return await ArtifactsCommand.RunAsync(normalized[1], saveArtifacts);

                case "comparisons":
                    return await ComparisonsCommand.RunAsync(normalized.Skip(1).ToArray());

                case "cost-estimate":
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

                case "data-consistency":
                    return await DataConsistencyCommand.RunAsync(normalized.Skip(1).ToArray());

                case "health":
                    return await HealthCommand.RunAsync();

                case "validate-config":
                    return await ValidateConfigCommand.RunAsync(
                        normalized
                            .Skip(1)
                            .ToArray());

                case "saml":
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

                case "compliance-report":
                    return await ComplianceReportCommand.RunAsync(
                        normalized
                            .Skip(1)
                            .ToArray());

                case "webhooks":
                    if (normalized.Length > 1 && normalized[1] == "test")
                        return await WebhooksTestCommand.RunAsync(
                            normalized
                                .Skip(2)
                                .ToArray());

                    WebhooksTestCommand.WriteUsage(false);

                    return CliExitCode.UsageError;

                case "policy":
                    if (normalized.Length > 2 && normalized[1] == "validate")
                        return await PolicyValidateCommand.RunAsync(normalized[2], "policy validate");

                    Console.WriteLine("Usage: archlucid policy validate <file.json>");

                    return CliExitCode.UsageError;

                case "policy-pack":
                    if (normalized.Length > 2 && normalized[1] == "validate")
                        return await PolicyValidateCommand.RunAsync(normalized[2], "policy-pack validate");

                    Console.WriteLine("Usage: archlucid policy-pack validate <file.json>");

                    return CliExitCode.UsageError;

                case "pack":
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

                case "templates":
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

                case "graph":
                    if (normalized.Length > 2 && normalized[1] == "export")
                        return await GraphExportCommand.RunAsync(
                            normalized
                                .Skip(2)
                                .ToArray());

                    Console.WriteLine(
                        "Usage: archlucid graph export <runId> [--format mermaid|graphml] [--decision <key>] [--out <path>]");

                    return CliExitCode.UsageError;

                case "rules":
                    if (normalized.Length > 1 && normalized[1] == "simulate")
                        return await RulesSimulateCommand.RunAsync(
                            normalized
                                .Skip(2)
                                .ToArray());

                    Console.WriteLine(
                        "Usage: archlucid rules simulate --run <runGuid> [--severity Warning] [--count 3]");

                    return CliExitCode.UsageError;

                case "onboard-preflight":
                    return await OnboardPreflightCommand.RunAsync(normalized.Skip(1).ToArray());

                case "stack":
                    if (normalized.Length > 1 && string.Equals(normalized[1], "init", StringComparison.Ordinal))
                        return await StackInitCommand.RunAsync(normalized.Skip(2).ToArray());

                    if (normalized.Length > 1 && string.Equals(normalized[1], "diff", StringComparison.Ordinal))
                        return await StackDiffCommand.RunAsync(normalized.Skip(2).ToArray());

                    if (normalized.Length > 1 && string.Equals(normalized[1], "doctor", StringComparison.Ordinal))
                        return await StackDoctorCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine(
                        "Usage: archlucid stack init [--from-example] [--answers <path>] [--out <dir>] [--force] [--repo-root <dir>] | archlucid stack diff [--answers <path>] [--out <dir>] [--repo-root <dir>] | archlucid stack doctor [--profile FirstPilotMinimum|StagingRealLlm|ProductionLike|staging-deploy|post-deploy] [--answers <path>] [--api-base-url <url>] [--json]");

                    return CliExitCode.UsageError;

                case "doctor":
                case "check":
                    return await DoctorCommand.RunAsync(CliCommandShared.TryLoadConfigFromCwd());

                case "deployment-evidence":
                    return await DeploymentEvidenceCommand.RunAsync(normalized.Skip(1).ToArray());

                case "docs":
                    if (normalized.Length > 2
                        && string.Equals(normalized[1], "pdf", StringComparison.Ordinal)
                        && string.Equals(normalized[2], "render", StringComparison.Ordinal))
                        return await DocsPdfRenderCommand.RunAsync(normalized.Skip(3).ToArray());

                    Console.WriteLine(
                        "Usage: archlucid docs pdf render --markdown <path.md> --metadata <metadata.json> --out <path.pdf>");

                    return CliExitCode.UsageError;

                case "support":
                    if (normalized.Length > 2
                        && string.Equals(normalized[1], "incident-readiness-drill", StringComparison.OrdinalIgnoreCase))
                        return await SupportIncidentReadinessDrillCommand.RunAsync(normalized.Skip(2).ToArray());

                    Console.WriteLine("Usage: archlucid support incident-readiness-drill --out <directory>");

                    return CliExitCode.UsageError;

                case "support-bundle":
                    return await SupportBundleCommand.RunAsync(normalized.Skip(1).ToArray());

                case "completions":
                    return await CompletionsCommand.RunAsync(normalized.Skip(1).ToArray());

                case "config":
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

                default:
                    if (CliExecutionContext.JsonOutput)

                        CliJson.WriteFailureLine(
                            Console.Error,
                            CliExitCode.UsageError,
                            "unknown_command",
                            $"Unknown command: {command}");

                    else

                        Console.WriteLine($"Unknown command: {command}");

                    return CliExitCode.UsageError;
            }
        }
        finally
        {
            CliExecutionContext.JsonOutput = false;
        }
    }

    private static bool IsRootHelpRequest(string[] normalized)
    {
        if (normalized.Length != 1)
            return false;

        string token = normalized[0];

        return string.Equals(token, "--help", StringComparison.Ordinal)
               || string.Equals(token, "-h", StringComparison.Ordinal)
               || string.Equals(token, "-?", StringComparison.Ordinal);
    }

    private static void WriteRootHelpMessage()
    {
        CliRootHelpHints.WriteTryPilotLoopBanner();

        const string plain =
            "Please provide a command. Available commands: second-run <SECOND_RUN.toml|json> [--api-base-url <url>] [--ui-base-url <url>] [--no-open] [--commit-deadline <secs>], trial smoke --org <name> --email <email> [--display-name <name>] [--baseline-hours <n>] [--baseline-source <text>] [--api-base-url <url>] [--staging] [--skip-pilot-run-deltas], run [--idempotency-key <uuid>], status <runId>, trace <runId>, run-support-packet <runId>, submit <runId> <result.json>, commit <runId>, artifacts <runId> [--save], draft new [--text <intent>] [--system-name <name>] [--business-outcome <text>] [--api-base-url <url>] [--skip-must-questions] [--no-auto-execute], request create --from-file <path> [--request-id <id>], new <projectName>, explain-operator-model, roi export [--out <file.csv>] [--api-base-url <url>], roi board-pack [--format md|pdf] [--out <path>] [--api-base-url <url>], roi-bulletin --quarter <Q-YYYY> [--min-tenants <n>] [--out <file.md>] [--synthetic] [--explain], auth validate-saml --metadata <file.xml> --claim-mapping <file.json>, integration retry-dead-letter [--tenant-id <guid>] [--event-type <type>] | integration simulate-webhook --event-type <alias> --target-url <url>, compliance export-drift --start-date <utc> --end-date <utc> [--format csv|md], agent-eval rollup --from-json <agent-evaluation.json> [--json], real-llm-evidence summarize --from-json <path>, security-trust publish --kind pen-test --date <YYYY-MM-DD> --summary-url <URL> [--assessor <name>] [--assessment-code <code>] [--ui-base-url <url>], marketplace preflight [--repo <dir>], azure terraform-export --subscription <subId> --resource-group <name> --out <bundle.zip>, az-roles (--subscription|--scope, --assignee, [--shell bash|powershell|both]), az-token-test (ARCHLUCID_AZURE_TOKEN_TEST_SCOPE optional), manifest validate --file <path.json>, golden-cohort lock-baseline [--cohort <path>] [--write] | golden-cohort drift [--cohort <path>] [--strict-real] [--structural-only], templates list [--repo-root <dir>], first-value-report <runId> [--save], buyer-proof-pack <runId> --out <path.zip> [--repo-root <dir>], proof-packet --runId <runId> --out <path.zip>, sponsor-one-pager <runId> [--save], reference-evidence | proof-pack (--run or --tenant; same CLI), comparisons list [filters], comparisons replay <comparisonRecordId> [--format <f>] [--mode <m>] [--profile <p>] [--persist], cost-estimate [--live-pricing] <manifest.json|extractor.zip>, data-consistency orphans [--api-base-url <url>] | data-consistency remediate <target> [--execute] [--max-rows <n>] [--api-base-url <url>], health, validate-config, saml test-config, compliance-report [--out <file.md>] [--repo <dir>] [--with-live-audit], policy validate <file.json> | policy-pack validate <file.json>, pack export-scaffold [--output <path>] [--force], graph export <runId> [--format mermaid|graphml] [--decision <key>] [--out <path>], rules simulate --run <runGuid> [--severity Warning] [--count 3], webhooks test [--url <url>] [--secret <s>] [--payload <path>] [--help], config check [--no-api], config lint [--simulate-production] [--hosting-advisor], config bootstrap [--out <path>] [--force], doctor (or check), deployment-evidence --environment <staging|production|dev> --api-base-url <url> [--out <path>] [--repo <dir>] [--synthetic-path <path>] [--allow-missing-openapi], support-bundle [--output <dir>] [--zip], completions bash|zsh|powershell, pilot init | pilot success-criteria-template | pilot preflight | pilot proof | pilot proof-packet | pilot ship-gate-evidence | pilot frontier-ai-baseline | pilot itsm-pull-forward-gate | pilot citation-integrity | pilot tenant-isolation-negative-test | pilot return-trigger-telemetry | pilot buyer-proof-evidence-ledger | pilot decision-owner-scoreboard | pilot readiness-bundle. Global: --json for machine-readable output where supported. Set ARCHLUCID_API_URL or apiUrl in archlucid.json (example: https://staging.archlucid.net).";

        if (CliExecutionContext.JsonOutput)

            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);

        else

            Console.WriteLine(plain);
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
