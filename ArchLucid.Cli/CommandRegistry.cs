namespace ArchLucid.Cli;

internal delegate Task<int> CliCommandHandler(string[] normalized);

/// <summary>
///     Maps top-level CLI command names to handlers and generates root help from registered metadata.
/// </summary>
internal sealed class CommandRegistry
{
    private readonly Dictionary<string, CliCommandHandler> _handlers = new(StringComparer.Ordinal);
    private readonly List<CommandDescriptor> _descriptors = [];

    public static CommandRegistry Default { get; } = CreateDefault();

    public IReadOnlyList<CommandDescriptor> Descriptors => _descriptors;

    public bool TryResolve(string commandName, out CliCommandHandler? handler) =>
        _handlers.TryGetValue(commandName, out handler);

    public async Task<int> DispatchAsync(string[] normalized)
    {
        string command = normalized[0];

        if (!_handlers.TryGetValue(command, out CliCommandHandler? handler))
        {
            WriteUnknownCommand(command);

            return CliExitCode.UsageError;
        }

        return await handler(normalized).ConfigureAwait(false);
    }

    public void WriteRootHelp()
    {
        CliRootHelpHints.WriteTryPilotLoopBanner();

        string usages = string.Join(", ", _descriptors.Select(static d => d.Usage));
        string plain =
            "Please provide a command. Available commands: "
            + usages
            + ". Global: --json for machine-readable output where supported. Set ARCHLUCID_API_URL or apiUrl in archlucid.json (example: https://staging.archlucid.net).";

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", plain);
        else
            Console.WriteLine(plain);
    }

    public static void WriteUnknownCommand(string command)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "unknown_command",
                $"Unknown command: {command}");
        else
            Console.WriteLine($"Unknown command: {command}");
    }

    private void Register(CommandDescriptor descriptor, CliCommandHandler handler, params string[] aliases)
    {
        _descriptors.Add(descriptor);
        _handlers[descriptor.Name] = handler;

        foreach (string alias in aliases)
            _handlers[alias] = handler;
    }

    private static CommandRegistry CreateDefault()
    {
        CommandRegistry registry = new();

        registry.Register(
            new CommandDescriptor(
                "second-run",
                "Run a second-review workflow from a TOML or JSON file.",
                "second-run <SECOND_RUN.toml|json> [--api-base-url <url>] [--ui-base-url <url>] [--no-open] [--commit-deadline <secs>]"),
            CliCommandHandlers.HandleSecondRun);

        registry.Register(
            new CommandDescriptor(
                "trial",
                "Trial onboarding smoke checks.",
                "trial smoke --org <name> --email <email> [--display-name <name>] [--baseline-hours <n>] [--baseline-source <text>] [--api-base-url <url>] [--staging] [--skip-pilot-run-deltas]"),
            CliCommandHandlers.HandleTrial);

        registry.Register(
            new CommandDescriptor(
                "run",
                "Start an architecture run against the configured API.",
                "run [--idempotency-key <uuid>]"),
            CliCommandHandlers.HandleRun);

        registry.Register(
            new CommandDescriptor("status", "Fetch run status.", "status <runId>"),
            CliCommandHandlers.HandleStatus);

        registry.Register(
            new CommandDescriptor("trace", "Fetch run trace.", "trace <runId>"),
            CliCommandHandlers.HandleTrace);

        registry.Register(
            new CommandDescriptor("run-support-packet", "Export a run support packet.", "run-support-packet <runId>"),
            CliCommandHandlers.HandleRunSupportPacket);

        registry.Register(
            new CommandDescriptor("submit", "Submit run results.", "submit <runId> <result.json>"),
            CliCommandHandlers.HandleSubmit);

        registry.Register(
            new CommandDescriptor("commit", "Commit a run.", "commit <runId>"),
            CliCommandHandlers.HandleCommit);

        registry.Register(
            new CommandDescriptor("artifacts", "List or save run artifacts.", "artifacts <runId> [--save]"),
            CliCommandHandlers.HandleArtifacts);

        registry.Register(
            new CommandDescriptor(
                "draft",
                "Create a draft architecture request.",
                "draft new [--text <intent>] [--system-name <name>] [--business-outcome <text>] [--api-base-url <url>] [--skip-must-questions] [--no-auto-execute]"),
            CliCommandHandlers.HandleDraft);

        registry.Register(
            new CommandDescriptor(
                "request",
                "Create an architecture request from a file.",
                "request create --from-file <path> [--request-id <id>]"),
            CliCommandHandlers.HandleRequest);

        registry.Register(
            new CommandDescriptor("new", "Scaffold a new ArchLucid project folder.", "new <projectName>"),
            CliCommandHandlers.HandleNew);

        registry.Register(
            new CommandDescriptor("explain-operator-model", "Explain the operator model.", "explain-operator-model"),
            CliCommandHandlers.HandleExplainOperatorModel);

        registry.Register(
            new CommandDescriptor(
                "roi",
                "Export ROI data or generate a board pack.",
                "roi export [--out <file.csv>] [--api-base-url <url>], roi board-pack [--format md|pdf] [--out <path>] [--api-base-url <url>]"),
            CliCommandHandlers.HandleRoi);

        registry.Register(
            new CommandDescriptor(
                "roi-bulletin",
                "Generate an ROI bulletin.",
                "roi-bulletin --quarter <Q-YYYY> [--min-tenants <n>] [--out <file.md>] [--synthetic] [--explain]"),
            CliCommandHandlers.HandleRoiBulletin);

        registry.Register(
            new CommandDescriptor(
                "auth",
                "Authentication and SSO diagnostics.",
                "auth validate-saml --metadata <file.xml> --claim-mapping <file.json>"),
            CliCommandHandlers.HandleAuth);

        registry.Register(
            new CommandDescriptor(
                "integration",
                "Integration webhook and dead-letter utilities.",
                "integration retry-dead-letter [--tenant-id <guid>] [--event-type <type>] | integration simulate-webhook --event-type <alias> --target-url <url>"),
            CliCommandHandlers.HandleIntegration);

        registry.Register(
            new CommandDescriptor(
                "compliance",
                "Compliance export utilities.",
                "compliance export-drift --start-date <utc> --end-date <utc> [--format csv|md]"),
            CliCommandHandlers.HandleCompliance);

        registry.Register(
            new CommandDescriptor(
                "agent-eval",
                "Agent evaluation rollup.",
                "agent-eval rollup --from-json <agent-evaluation.json> [--json]"),
            CliCommandHandlers.HandleAgentEval);

        registry.Register(
            new CommandDescriptor(
                "real-llm-evidence",
                "Summarize real LLM evidence JSON.",
                "real-llm-evidence summarize --from-json <path>"),
            CliCommandHandlers.HandleRealLlmEvidence);

        registry.Register(
            new CommandDescriptor(
                "security-trust",
                "Publish security trust artifacts.",
                "security-trust publish --kind pen-test --date <YYYY-MM-DD> --summary-url <URL> [--assessor <name>] [--assessment-code <code>] [--ui-base-url <url>]"),
            CliCommandHandlers.HandleSecurityTrust);

        registry.Register(
            new CommandDescriptor("marketplace", "Marketplace preflight checks.", "marketplace preflight [--repo <dir>]"),
            CliCommandHandlers.HandleMarketplace);

        registry.Register(
            new CommandDescriptor(
                "azure",
                "Azure inventory export and validation.",
                "azure terraform-export --subscription <subId> --resource-group <name> --out <bundle.zip>"),
            CliCommandHandlers.HandleAzure);

        registry.Register(
            new CommandDescriptor(
                "az-roles",
                "Print Azure role assignment commands.",
                "az-roles (--subscription|--scope, --assignee, [--shell bash|powershell|both])"),
            CliCommandHandlers.HandleAzRoles);

        registry.Register(
            new CommandDescriptor(
                "az-token-test",
                "Test Azure token acquisition.",
                "az-token-test (ARCHLUCID_AZURE_TOKEN_TEST_SCOPE optional)"),
            CliCommandHandlers.HandleAzTokenTest);

        registry.Register(
            new CommandDescriptor(
                "manifest",
                "Validate golden manifest JSON.",
                "manifest validate --file <path.json>"),
            CliCommandHandlers.HandleManifest);

        registry.Register(
            new CommandDescriptor(
                "golden-cohort",
                "Golden cohort baseline and drift checks.",
                "golden-cohort lock-baseline [--cohort <path>] [--write] | golden-cohort drift [--cohort <path>] [--strict-real] [--structural-only]"),
            CliCommandHandlers.HandleGoldenCohort);

        registry.Register(
            new CommandDescriptor("templates", "List repository templates.", "templates list [--repo-root <dir>]"),
            CliCommandHandlers.HandleTemplates);

        registry.Register(
            new CommandDescriptor("first-value-report", "Generate a first-value report.", "first-value-report <runId> [--save]"),
            CliCommandHandlers.HandleFirstValueReport);

        registry.Register(
            new CommandDescriptor("buyer-proof-pack", "Export a buyer proof pack.", "buyer-proof-pack <runId> --out <path.zip> [--repo-root <dir>]"),
            CliCommandHandlers.HandleBuyerProofPack);

        registry.Register(
            new CommandDescriptor("proof-packet", "Export a proof packet.", "proof-packet --runId <runId> --out <path.zip>"),
            CliCommandHandlers.HandleProofPacket);

        registry.Register(
            new CommandDescriptor("sponsor-one-pager", "Generate a sponsor one-pager.", "sponsor-one-pager <runId> [--save]"),
            CliCommandHandlers.HandleSponsorOnePager);

        registry.Register(
            new CommandDescriptor(
                "reference-evidence",
                "Export reference evidence (alias: proof-pack).",
                "reference-evidence | proof-pack (--run or --tenant; same CLI)"),
            CliCommandHandlers.HandleReferenceEvidence,
            "proof-pack");

        registry.Register(
            new CommandDescriptor(
                "comparisons",
                "List or replay architecture comparisons.",
                "comparisons list [filters], comparisons replay <comparisonRecordId> [--format <f>] [--mode <m>] [--profile <p>] [--persist]"),
            CliCommandHandlers.HandleComparisons);

        registry.Register(
            new CommandDescriptor(
                "cost-estimate",
                "Estimate infrastructure cost from manifest or zip.",
                "cost-estimate [--live-pricing] <manifest.json|extractor.zip>"),
            CliCommandHandlers.HandleCostEstimate);

        registry.Register(
            new CommandDescriptor(
                "data-consistency",
                "Data consistency orphan scan and remediation.",
                "data-consistency orphans [--api-base-url <url>] | data-consistency remediate <target> [--execute] [--max-rows <n>] [--api-base-url <url>]"),
            CliCommandHandlers.HandleDataConsistency);

        registry.Register(
            new CommandDescriptor("health", "API health check.", "health"),
            CliCommandHandlers.HandleHealth);

        registry.Register(
            new CommandDescriptor("validate-config", "Validate archlucid.json configuration.", "validate-config"),
            CliCommandHandlers.HandleValidateConfig);

        registry.Register(
            new CommandDescriptor("saml", "SAML configuration test.", "saml test-config"),
            CliCommandHandlers.HandleSaml);

        registry.Register(
            new CommandDescriptor(
                "compliance-report",
                "Generate a compliance report.",
                "compliance-report [--out <file.md>] [--repo <dir>] [--with-live-audit]"),
            CliCommandHandlers.HandleComplianceReport);

        registry.Register(
            new CommandDescriptor(
                "policy",
                "Validate a policy JSON document.",
                "policy validate <file.json> | policy-pack validate <file.json>"),
            CliCommandHandlers.HandlePolicy);

        registry.Register(
            new CommandDescriptor(
                "pack",
                "Export policy pack scaffold.",
                "pack export-scaffold [--output <path>] [--force]"),
            CliCommandHandlers.HandlePack);

        registry.Register(
            new CommandDescriptor(
                "graph",
                "Export decision graph for a run.",
                "graph export <runId> [--format mermaid|graphml] [--decision <key>] [--out <path>]"),
            CliCommandHandlers.HandleGraph);

        registry.Register(
            new CommandDescriptor(
                "rules",
                "Simulate governance rules for a run.",
                "rules simulate --run <runGuid> [--severity Warning] [--count 3]"),
            CliCommandHandlers.HandleRules);

        registry.Register(
            new CommandDescriptor(
                "webhooks",
                "Test outbound webhooks.",
                "webhooks test [--url <url>] [--secret <s>] [--payload <path>] [--help]"),
            CliCommandHandlers.HandleWebhooks);

        registry.Register(
            new CommandDescriptor(
                "config",
                "Configuration check, lint, and bootstrap.",
                "config check [--no-api], config lint [--simulate-production] [--hosting-advisor], config bootstrap [--out <path>] [--force]"),
            CliCommandHandlers.HandleConfig);

        registry.Register(
            new CommandDescriptor("doctor", "Environment readiness check (alias: check).", "doctor (or check)"),
            CliCommandHandlers.HandleDoctor,
            "check");

        registry.Register(
            new CommandDescriptor(
                "deployment-evidence",
                "Collect deployment evidence probes.",
                "deployment-evidence --environment <staging|production|dev> --api-base-url <url> [--out <path>] [--repo <dir>] [--synthetic-path <path>] [--allow-missing-openapi]"),
            CliCommandHandlers.HandleDeploymentEvidence);

        registry.Register(
            new CommandDescriptor("support-bundle", "Build a redacted support bundle.", "support-bundle [--output <dir>] [--zip]"),
            CliCommandHandlers.HandleSupportBundle);

        registry.Register(
            new CommandDescriptor("completions", "Emit shell completion scripts.", "completions bash|zsh|powershell"),
            CliCommandHandlers.HandleCompletions);

        registry.Register(
            new CommandDescriptor(
                "pilot",
                "Pilot onboarding, proof, and readiness workflows.",
                "pilot init | pilot success-criteria-template | pilot preflight | pilot proof | pilot proof-packet | pilot ship-gate-evidence | pilot frontier-ai-baseline | pilot itsm-pull-forward-gate | pilot citation-integrity | pilot tenant-isolation-negative-test | pilot return-trigger-telemetry | pilot buyer-proof-evidence-ledger | pilot decision-owner-scoreboard | pilot readiness-bundle"),
            CliCommandHandlers.HandlePilot);

        registry.Register(
            new CommandDescriptor(
                "policy-pack",
                "Validate a policy pack JSON document.",
                "policy-pack validate <file.json>"),
            CliCommandHandlers.HandlePolicyPack);

        registry.Register(
            new CommandDescriptor("procurement-pack", "Export a procurement pack.", "procurement-pack"),
            CliCommandHandlers.HandleProcurementPack);

        registry.Register(
            new CommandDescriptor("sponsor-packet", "Export a sponsor packet.", "sponsor-packet"),
            CliCommandHandlers.HandleSponsorPacket);

        registry.Register(
            new CommandDescriptor("real-mode", "Real-mode smoke checks.", "real-mode smoke"),
            CliCommandHandlers.HandleRealMode);

        registry.Register(
            new CommandDescriptor("aws", "AWS inventory zip validation.", "aws validate-zip --path <file.zip>"),
            CliCommandHandlers.HandleAws);

        registry.Register(
            new CommandDescriptor("gcp", "GCP inventory zip validation.", "gcp validate-zip --path <file.zip>"),
            CliCommandHandlers.HandleGcp);

        registry.Register(
            new CommandDescriptor("onboard-preflight", "Onboarding preflight checks.", "onboard-preflight"),
            CliCommandHandlers.HandleOnboardPreflight);

        registry.Register(
            new CommandDescriptor(
                "stack",
                "Stack init, diff, and doctor workflows.",
                "stack init | stack diff | stack doctor"),
            CliCommandHandlers.HandleStack);

        registry.Register(
            new CommandDescriptor(
                "docs",
                "Documentation utilities.",
                "docs pdf render --markdown <path.md> --metadata <metadata.json> --out <path.pdf>"),
            CliCommandHandlers.HandleDocs);

        registry.Register(
            new CommandDescriptor(
                "support",
                "Support incident readiness drill.",
                "support incident-readiness-drill --out <directory>"),
            CliCommandHandlers.HandleSupport);

        return registry;
    }
}
