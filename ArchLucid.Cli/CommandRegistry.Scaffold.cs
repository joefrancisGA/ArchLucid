namespace ArchLucid.Cli;

internal sealed partial class CommandRegistry
{
    private void RegisterScaffoldCommands()
    {
        Register(
            new CommandDescriptor("new", "Scaffold a new ArchLucid project folder.", "new <projectName>"),
            CliCommandHandlers.HandleNew);

        Register(
            new CommandDescriptor("explain-operator-model", "Explain the operator model.", "explain-operator-model"),
            CliCommandHandlers.HandleExplainOperatorModel);

        Register(
            new CommandDescriptor(
                "azure",
                "Azure inventory export and validation.",
                "azure terraform-export --subscription <subId> --resource-group <name> --out <bundle.zip>"),
            CliCommandHandlers.HandleAzure);

        Register(
            new CommandDescriptor(
                "az-roles",
                "Print Azure role assignment commands.",
                "az-roles (--subscription|--scope, --assignee, [--shell bash|powershell|both])"),
            CliCommandHandlers.HandleAzRoles);

        Register(
            new CommandDescriptor(
                "manifest",
                "Validate golden manifest JSON.",
                "manifest validate --file <path.json>"),
            CliCommandHandlers.HandleManifest);

        Register(
            new CommandDescriptor("templates", "List repository templates.", "templates list [--repo-root <dir>]"),
            CliCommandHandlers.HandleTemplates);

        Register(
            new CommandDescriptor(
                "policy",
                "Validate a policy JSON document.",
                "policy validate <file.json> | policy-pack validate <file.json>"),
            CliCommandHandlers.HandlePolicy);

        Register(
            new CommandDescriptor(
                "pack",
                "Export policy pack scaffold.",
                "pack export-scaffold [--output <path>] [--force]"),
            CliCommandHandlers.HandlePack);

        Register(
            new CommandDescriptor(
                "graph",
                "Export decision graph for a run.",
                "graph export <runId> [--format mermaid|graphml] [--decision <key>] [--out <path>]"),
            CliCommandHandlers.HandleGraph);

        Register(
            new CommandDescriptor(
                "rules",
                "Simulate governance rules for a run.",
                "rules simulate --run <runGuid> [--severity Warning] [--count 3]"),
            CliCommandHandlers.HandleRules);

        Register(
            new CommandDescriptor(
                "policy-pack",
                "Validate a policy pack JSON document.",
                "policy-pack validate <file.json>"),
            CliCommandHandlers.HandlePolicyPack);

        Register(
            new CommandDescriptor("aws", "AWS inventory zip validation.", "aws validate-zip --path <file.zip>"),
            CliCommandHandlers.HandleAws);

        Register(
            new CommandDescriptor("gcp", "GCP inventory zip validation.", "gcp validate-zip --path <file.zip>"),
            CliCommandHandlers.HandleGcp);

        Register(
            new CommandDescriptor(
                "stack",
                "Stack init, diff, and doctor workflows.",
                "stack init | stack diff | stack doctor"),
            CliCommandHandlers.HandleStack);

        Register(
            new CommandDescriptor(
                "docs",
                "Documentation utilities.",
                "docs pdf render --markdown <path.md> --metadata <metadata.json> --out <path.pdf>"),
            CliCommandHandlers.HandleDocs);
    }
}
