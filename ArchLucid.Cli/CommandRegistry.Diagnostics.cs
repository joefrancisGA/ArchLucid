namespace ArchLucid.Cli;

internal sealed partial class CommandRegistry
{
    private void RegisterDiagnosticsCommands()
    {
        Register(
            new CommandDescriptor(
                "auth",
                "Authentication and SSO diagnostics.",
                "auth validate-saml --metadata <file.xml> --claim-mapping <file.json>"),
            CliCommandHandlers.HandleAuth);

        Register(
            new CommandDescriptor(
                "integration",
                "Integration webhook and dead-letter utilities.",
                "integration retry-dead-letter [--tenant-id <guid>] [--event-type <type>] | integration simulate-webhook --event-type <alias> --target-url <url>"),
            CliCommandHandlers.HandleIntegration);

        Register(
            new CommandDescriptor(
                "compliance",
                "Compliance export utilities.",
                "compliance export-drift --start-date <utc> --end-date <utc> [--format csv|md]"),
            CliCommandHandlers.HandleCompliance);

        Register(
            new CommandDescriptor(
                "compliance-report",
                "Generate a compliance report.",
                "compliance-report [--out <file.md>] [--repo <dir>] [--with-live-audit]"),
            CliCommandHandlers.HandleComplianceReport);

        Register(
            new CommandDescriptor(
                "data-consistency",
                "Data consistency orphan scan and remediation.",
                "data-consistency orphans [--api-base-url <url>] | data-consistency remediate <target> [--execute] [--max-rows <n>] [--api-base-url <url>]"),
            CliCommandHandlers.HandleDataConsistency);

        Register(
            new CommandDescriptor("health", "API health check.", "health"),
            CliCommandHandlers.HandleHealth);

        Register(
            new CommandDescriptor("validate-config", "Validate archlucid.json configuration.", "validate-config"),
            CliCommandHandlers.HandleValidateConfig);

        Register(
            new CommandDescriptor("saml", "SAML configuration test.", "saml test-config"),
            CliCommandHandlers.HandleSaml);

        Register(
            new CommandDescriptor(
                "webhooks",
                "Test outbound webhooks.",
                "webhooks test [--url <url>] [--secret <s>] [--payload <path>] [--help]"),
            CliCommandHandlers.HandleWebhooks);

        Register(
            new CommandDescriptor(
                "config",
                "Configuration check, lint, and bootstrap.",
                "config check [--no-api], config lint [--simulate-production] [--hosting-advisor], config bootstrap [--out <path>] [--force]"),
            CliCommandHandlers.HandleConfig);

        Register(
            new CommandDescriptor("doctor", "Environment readiness check (alias: check).", "doctor (or check)"),
            CliCommandHandlers.HandleDoctor,
            "check");

        Register(
            new CommandDescriptor(
                "deployment-evidence",
                "Collect deployment evidence probes.",
                "deployment-evidence --environment <staging|production|dev> --api-base-url <url> [--out <path>] [--repo <dir>] [--synthetic-path <path>] [--allow-missing-openapi]"),
            CliCommandHandlers.HandleDeploymentEvidence);

        Register(
            new CommandDescriptor("support-bundle", "Build a redacted support bundle.", "support-bundle [--output <dir>] [--zip]"),
            CliCommandHandlers.HandleSupportBundle);

        Register(
            new CommandDescriptor("completions", "Emit shell completion scripts.", "completions bash|zsh|powershell"),
            CliCommandHandlers.HandleCompletions);

        Register(
            new CommandDescriptor("onboard-preflight", "Onboarding preflight checks.", "onboard-preflight"),
            CliCommandHandlers.HandleOnboardPreflight);

        Register(
            new CommandDescriptor(
                "az-token-test",
                "Test Azure token acquisition.",
                "az-token-test (ARCHLUCID_AZURE_TOKEN_TEST_SCOPE optional)"),
            CliCommandHandlers.HandleAzTokenTest);

        Register(
            new CommandDescriptor("real-mode", "Real-mode smoke checks.", "real-mode smoke"),
            CliCommandHandlers.HandleRealMode);

        Register(
            new CommandDescriptor(
                "support",
                "Support incident readiness drill.",
                "support incident-readiness-drill --out <directory>"),
            CliCommandHandlers.HandleSupport);
    }
}
