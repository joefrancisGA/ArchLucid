namespace ArchLucid.Cli.Commands;

internal sealed class CitationIntegrityOptions
{
    public string? FixturesDirectory { get; init; }

    public string? ManifestPath { get; init; }

    public string? RulesPath { get; init; }

    public string? JsonOutPath { get; init; }

    public string? MarkdownOutPath { get; init; }

    public bool IncludeApi { get; init; }

    public int? SampleSize { get; init; }

    public int? FailThreshold { get; init; }

    public bool SuppressDefaultArtifacts { get; init; }

    public static CitationIntegrityOptions Parse(string[] args)
    {
        ArgumentNullException.ThrowIfNull(args);

        int? sampleSize = TryParsePositiveInt(CliCommandShared.TryGetOptionValue(args, "--sample-size"));
        int? failThreshold = TryParsePositiveInt(CliCommandShared.TryGetOptionValue(args, "--fail-threshold"));

        return new CitationIntegrityOptions
        {
            FixturesDirectory = CliCommandShared.TryGetOptionValue(args, "--fixtures-dir"),
            ManifestPath = CliCommandShared.TryGetOptionValue(args, "--manifest"),
            RulesPath = CliCommandShared.TryGetOptionValue(args, "--rules"),
            JsonOutPath = CliCommandShared.TryGetOptionValue(args, "--json-out"),
            MarkdownOutPath = CliCommandShared.TryGetOptionValue(args, "--markdown-out"),
            IncludeApi = args.Any(static arg => string.Equals(arg, "--include-api", StringComparison.Ordinal)),
            SampleSize = sampleSize,
            FailThreshold = failThreshold,
            SuppressDefaultArtifacts = args.Any(static arg =>
                string.Equals(arg, "--no-write-artifacts", StringComparison.OrdinalIgnoreCase)),
        };
    }

    private static int? TryParsePositiveInt(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (!int.TryParse(raw, out int parsed) || parsed <= 0)
            throw new ArgumentException($"Invalid positive integer: {raw}");

        return parsed;
    }
}
