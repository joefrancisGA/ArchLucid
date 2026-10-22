namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceOptions
{
    public required string RunId
    {
        get;
        init;
    }

    public string? JsonOutPath
    {
        get;
        init;
    }

    public string? MarkdownOutPath
    {
        get;
        init;
    }

    public string? UiBaseUrl
    {
        get;
        init;
    }

    public string? AlternateTenantId
    {
        get;
        init;
    }

    public string? AlternateWorkspaceId
    {
        get;
        init;
    }

    public string? AlternateProjectId
    {
        get;
        init;
    }

    public bool SkipClaimLint
    {
        get;
        init;
    }

    public bool SuppressDefaultArtifacts
    {
        get;
        init;
    }

    public TenantIsolationNegativeTestOptions ToTenantIsolationOptions() =>
        new()
        {
            RunId = RunId,
            AlternateTenantId = AlternateTenantId,
            AlternateWorkspaceId = AlternateWorkspaceId,
            AlternateProjectId = AlternateProjectId,
        };

    public static ShipGateEvidenceOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        string? runId = CliCommandShared.TryGetOptionValue(args, "--run-id");

        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Missing required --run-id <guid> option.", nameof(args));

        return new ShipGateEvidenceOptions
        {
            RunId = runId.Trim(),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            UiBaseUrl = CliCommandShared.TryGetOptionValue(args, "--ui-base-url"),
            AlternateTenantId = CliCommandShared.TryGetOptionValue(args, "--alternate-tenant-id"),
            AlternateWorkspaceId = CliCommandShared.TryGetOptionValue(args, "--alternate-workspace-id"),
            AlternateProjectId = CliCommandShared.TryGetOptionValue(args, "--alternate-project-id"),
            SkipClaimLint = args.Any(static arg => string.Equals(arg, "--skip-claim-lint", StringComparison.OrdinalIgnoreCase)),
            SuppressDefaultArtifacts = args.Any(static arg => string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
