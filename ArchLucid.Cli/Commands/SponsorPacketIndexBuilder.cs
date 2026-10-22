using System.Globalization;
using System.Text;

namespace ArchLucid.Cli.Commands;

/// <summary>Builds the sponsor-packet root <c>index.md</c> (T2-7).</summary>
public static class SponsorPacketIndexBuilder
{
    public static string Build(string runId, string outputDirectory, IReadOnlyList<string> presentFileNames)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);
        ArgumentNullException.ThrowIfNull(presentFileNames);

        HashSet<string> present = new(presentFileNames, StringComparer.OrdinalIgnoreCase);
        StringBuilder sb = new();
        DateTimeOffset generatedUtc = TimeProvider.System.GetUtcNow();

        sb.AppendLine("# Sponsor packet index");
        sb.AppendLine();
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Run id:** `{runId.Trim()}`");
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Generated (UTC):** {generatedUtc:O}");
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Output folder:** `{outputDirectory}`");
        sb.AppendLine();
        sb.AppendLine("Buyer-safe bundle for one committed architecture review. No secrets or internal diagnostics.");
        sb.AppendLine();
        sb.AppendLine("## Artifacts");
        sb.AppendLine();
        sb.AppendLine("| File | Purpose | Present |");
        sb.AppendLine("| --- | --- | :---: |");

        foreach (SponsorPacketArtifactEntry entry in SponsorPacketArtifactCatalog.IndexEntries)
        {
            string status = present.Contains(entry.FileName) ? "yes" : "no";
            sb.Append("| `");
            sb.Append(entry.FileName);
            sb.Append("` | ");
            sb.Append(entry.Purpose.Replace("|", "/", StringComparison.Ordinal));
            sb.Append(" | ");
            sb.Append(status);
            sb.AppendLine(" |");
        }

        foreach (string extra in presentFileNames.OrderBy(static name => name, StringComparer.OrdinalIgnoreCase))
        {
            string extraFileName = extra;

            if (SponsorPacketArtifactCatalog.IndexEntries.Any(entry =>
                    string.Equals(entry.FileName, extraFileName, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            sb.Append("| `");
            sb.Append(extra);
            sb.Append("` | Supporting governance or readiness artifact | yes |");
            sb.AppendLine();
        }

        sb.AppendLine();
        sb.AppendLine("## Regenerate");
        sb.AppendLine();
        sb.AppendLine("```bash");
        sb.AppendLine(CultureInfo.InvariantCulture, $"archlucid sponsor-packet {runId.Trim()} --out \"{outputDirectory}\"");
        sb.AppendLine("```");
        sb.AppendLine();
        sb.AppendLine("Review `limitations.md` before external circulation.");

        return sb.ToString();
    }
}
