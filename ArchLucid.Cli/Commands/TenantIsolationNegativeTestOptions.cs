namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestOptions
{
    public string? RunId { get; init; }

    public string? AlternateTenantId { get; init; }

    public string? AlternateWorkspaceId { get; init; }

    public string? AlternateProjectId { get; init; }

    public string? ManifestPath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static TenantIsolationNegativeTestOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        return new TenantIsolationNegativeTestOptions
        {
            RunId = CliCommandShared.TryGetOptionValue(args, "--run-id"),
            AlternateTenantId = CliCommandShared.TryGetOptionValue(args, "--alternate-tenant-id"),
            AlternateWorkspaceId = CliCommandShared.TryGetOptionValue(args, "--alternate-workspace-id"),
            AlternateProjectId = CliCommandShared.TryGetOptionValue(args, "--alternate-project-id"),
            ManifestPath = CliCommandShared.TryGetOptionValue(args, "--manifest"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }
}
