namespace ArchLucid.Cli.Commands;

/// <summary>
///     Parsed options for <c>archlucid pilot preflight</c>.
/// </summary>
internal sealed class PilotPreflightOptions
{
    public bool NoApi { get; init; }

    public bool IncludeItsm { get; init; }

    public bool SimulateProduction { get; init; }

    public bool MarkdownOutput { get; init; }

    /// <summary>When non-null, write markdown output to this path instead of stdout.</summary>
    public string? MarkdownOutPath { get; init; }

    internal static PilotPreflightOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        bool noApi = args.Contains("--no-api", StringComparer.OrdinalIgnoreCase);
        bool includeItsm = args.Contains("--include-itsm", StringComparer.OrdinalIgnoreCase);
        bool simulateProduction = args.Contains("--simulate-production", StringComparer.OrdinalIgnoreCase);
        bool md = args.Contains("--md", StringComparer.OrdinalIgnoreCase);

        string? markdownOutPath = null;
        int mdOutIndex = Array.FindIndex(
            args,
            a => string.Equals(a, "--markdown-out", StringComparison.OrdinalIgnoreCase));

        if (mdOutIndex >= 0 && mdOutIndex + 1 < args.Length)
        {
            markdownOutPath = args[mdOutIndex + 1];
            md = true;
        }

        return new PilotPreflightOptions
        {
            NoApi = noApi,
            IncludeItsm = includeItsm,
            SimulateProduction = simulateProduction,
            MarkdownOutput = md,
            MarkdownOutPath = markdownOutPath,
        };
    }
}
