namespace ArchLucid.Cli;

internal delegate Task<int> CliCommandHandler(string[] normalized);

/// <summary>
///     Maps top-level CLI command names to handlers and generates root help from registered metadata.
/// </summary>
internal sealed partial class CommandRegistry
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

        registry.RegisterCoreCommands();
        registry.RegisterDiagnosticsCommands();
        registry.RegisterProofCommands();
        registry.RegisterScaffoldCommands();

        return registry;
    }

    private void RegisterCoreCommands()
    {
        Register(
            new CommandDescriptor(
                "second-run",
                "Run a second-review workflow from a TOML or JSON file.",
                "second-run <SECOND_RUN.toml|json> [--api-base-url <url>] [--ui-base-url <url>] [--no-open] [--commit-deadline <secs>]"),
            CliCommandHandlers.HandleSecondRun);

        Register(
            new CommandDescriptor(
                "trial",
                "Trial onboarding smoke checks.",
                "trial smoke --org <name> --email <email> [--display-name <name>] [--baseline-hours <n>] [--baseline-source <text>] [--api-base-url <url>] [--staging] [--skip-pilot-run-deltas]"),
            CliCommandHandlers.HandleTrial);

        Register(
            new CommandDescriptor(
                "run",
                "Start an architecture run against the configured API.",
                "run [--idempotency-key <uuid>]"),
            CliCommandHandlers.HandleRun);

        Register(
            new CommandDescriptor("status", "Fetch run status.", "status <runId>"),
            CliCommandHandlers.HandleStatus);

        Register(
            new CommandDescriptor("trace", "Fetch run trace.", "trace <runId>"),
            CliCommandHandlers.HandleTrace);

        Register(
            new CommandDescriptor("run-support-packet", "Export a run support packet.", "run-support-packet <runId>"),
            CliCommandHandlers.HandleRunSupportPacket);

        Register(
            new CommandDescriptor("submit", "Submit run results.", "submit <runId> <result.json>"),
            CliCommandHandlers.HandleSubmit);

        Register(
            new CommandDescriptor("commit", "Commit a run.", "commit <runId>"),
            CliCommandHandlers.HandleCommit);

        Register(
            new CommandDescriptor("artifacts", "List or save run artifacts.", "artifacts <runId> [--save]"),
            CliCommandHandlers.HandleArtifacts);

        Register(
            new CommandDescriptor(
                "draft",
                "Create a draft architecture request.",
                "draft new [--text <intent>] [--system-name <name>] [--business-outcome <text>] [--api-base-url <url>] [--skip-must-questions] [--no-auto-execute]"),
            CliCommandHandlers.HandleDraft);

        Register(
            new CommandDescriptor(
                "request",
                "Create an architecture request from a file.",
                "request create --from-file <path> [--request-id <id>]"),
            CliCommandHandlers.HandleRequest);

        Register(
            new CommandDescriptor(
                "comparisons",
                "List or replay architecture comparisons.",
                "comparisons list [filters], comparisons replay <comparisonRecordId> [--format <f>] [--mode <m>] [--profile <p>] [--persist]"),
            CliCommandHandlers.HandleComparisons);

        Register(
            new CommandDescriptor(
                "architectures",
                "List or show durable architecture identities (not drafts or reviews).",
                "architectures list [--page <n>] [--page-size <n>], architectures get <architectureId>"),
            CliCommandHandlers.HandleArchitectures,
            "architecture");

        Register(
            new CommandDescriptor(
                "cost-estimate",
                "Estimate infrastructure cost from manifest or zip.",
                "cost-estimate [--live-pricing] <manifest.json|extractor.zip>"),
            CliCommandHandlers.HandleCostEstimate);
    }
}
