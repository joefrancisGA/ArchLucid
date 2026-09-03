namespace ArchLucid.Cli;

internal sealed partial class CommandRegistry
{
    private void RegisterProofCommands()
    {
        Register(
            new CommandDescriptor(
                "agent-eval",
                "Agent evaluation rollup.",
                "agent-eval rollup --from-json <agent-evaluation.json> [--json]"),
            CliCommandHandlers.HandleAgentEval);

        Register(
            new CommandDescriptor(
                "real-llm-evidence",
                "Summarize real LLM evidence JSON.",
                "real-llm-evidence summarize --from-json <path>"),
            CliCommandHandlers.HandleRealLlmEvidence);

        Register(
            new CommandDescriptor(
                "security-trust",
                "Publish security trust artifacts.",
                "security-trust publish --kind pen-test --date <YYYY-MM-DD> --summary-url <URL> [--assessor <name>] [--assessment-code <code>] [--ui-base-url <url>]"),
            CliCommandHandlers.HandleSecurityTrust);

        Register(
            new CommandDescriptor("marketplace", "Marketplace preflight checks.", "marketplace preflight [--repo <dir>]"),
            CliCommandHandlers.HandleMarketplace);

        Register(
            new CommandDescriptor(
                "golden-cohort",
                "Golden cohort baseline and drift checks.",
                "golden-cohort lock-baseline [--cohort <path>] [--write] | golden-cohort drift [--cohort <path>] [--strict-real] [--structural-only]"),
            CliCommandHandlers.HandleGoldenCohort);

        Register(
            new CommandDescriptor("first-value-report", "Generate a first-value report.", "first-value-report <runId> [--save]"),
            CliCommandHandlers.HandleFirstValueReport);

        Register(
            new CommandDescriptor("buyer-proof-pack", "Export a buyer proof pack.", "buyer-proof-pack <runId> --out <path.zip> [--repo-root <dir>]"),
            CliCommandHandlers.HandleBuyerProofPack);

        Register(
            new CommandDescriptor("proof-packet", "Export a proof packet.", "proof-packet --runId <runId> --out <path.zip>"),
            CliCommandHandlers.HandleProofPacket);

        Register(
            new CommandDescriptor("sponsor-one-pager", "Generate a sponsor one-pager.", "sponsor-one-pager <runId> [--save]"),
            CliCommandHandlers.HandleSponsorOnePager);

        Register(
            new CommandDescriptor(
                "reference-evidence",
                "Export reference evidence (alias: proof-pack).",
                "reference-evidence | proof-pack (--run or --tenant; same CLI)"),
            CliCommandHandlers.HandleReferenceEvidence,
            "proof-pack");

        Register(
            new CommandDescriptor(
                "roi",
                "Export ROI data or generate a board pack.",
                "roi export [--out <file.csv>] [--api-base-url <url>], roi board-pack [--format md|pdf] [--out <path>] [--api-base-url <url>]"),
            CliCommandHandlers.HandleRoi);

        Register(
            new CommandDescriptor(
                "roi-bulletin",
                "Generate an ROI bulletin.",
                "roi-bulletin --quarter <Q-YYYY> [--min-tenants <n>] [--out <file.md>] [--synthetic] [--explain]"),
            CliCommandHandlers.HandleRoiBulletin);

        Register(
            new CommandDescriptor(
                "pilot",
                "Pilot onboarding, proof, and readiness workflows.",
                "pilot init | pilot success-criteria-template | pilot preflight | pilot proof | pilot proof-packet | pilot ship-gate-evidence | pilot frontier-ai-baseline | pilot itsm-pull-forward-gate | pilot citation-integrity | pilot tenant-isolation-negative-test | pilot return-trigger-telemetry | pilot buyer-proof-evidence-ledger | pilot decision-owner-scoreboard | pilot readiness-bundle"),
            CliCommandHandlers.HandlePilot);

        Register(
            new CommandDescriptor("procurement-pack", "Export a procurement pack.", "procurement-pack"),
            CliCommandHandlers.HandleProcurementPack);

        Register(
            new CommandDescriptor("sponsor-packet", "Export a sponsor packet.", "sponsor-packet"),
            CliCommandHandlers.HandleSponsorPacket);
    }
}
