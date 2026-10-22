namespace ArchLucid.Cli.Commands;

internal static partial class PilotProofPacketCommand
{
    private static string PrependProofSummaryRoiLink(string markdown, string outputDirectory)
    {
        string roiPath = Path.Combine(outputDirectory, "roi-metric-sources.md");

        if (!File.Exists(roiPath))
            return markdown;

        return "- ROI source catalog: [roi-metric-sources.md](roi-metric-sources.md)\n\n" + markdown;
    }
}
