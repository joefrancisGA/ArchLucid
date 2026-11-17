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
            RunId = GetOptionValue(args, "--run-id"),
            AlternateTenantId = GetOptionValue(args, "--alternate-tenant-id"),
            AlternateWorkspaceId = GetOptionValue(args, "--alternate-workspace-id"),
            AlternateProjectId = GetOptionValue(args, "--alternate-project-id"),
            ManifestPath = GetOptionValue(args, "--manifest"),
            JsonOutPath = GetOptionValue(args, "--json-out"),
            MarkdownOutPath = GetOptionValue(args, "--markdown-out"),
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }

    private static string? GetOptionValue(IReadOnlyList<string> args, string optionName)
    {
        for (int index = 0; index < args.Count; index++)
        {
            if (!string.Equals(args[index], optionName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (index == args.Count - 1 || args[index + 1].StartsWith("--", StringComparison.Ordinal))
            {
                throw new ArgumentException($"Option '{optionName}' requires a value.", optionName);
            }

            return args[index + 1];
        }

        return null;
    }
}
