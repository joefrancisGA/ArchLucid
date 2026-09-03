namespace ArchLucid.Cli.Commands;

/// <summary>
///     Produces <c>buyer-decision-brief.md</c> from data already present in the sponsor packet.
///     No live API calls; all inputs are optional — missing artifacts produce explicit caveats rather than silent omissions.
/// </summary>
public static partial class SponsorPacketBuyerDecisionBriefBuilder
{
    /// <summary>Builds the brief from parsed file content supplied by the caller (pure — fully testable).</summary>
    public static string Build(BriefInputs inputs)
    {
        ArgumentNullException.ThrowIfNull(inputs);
        ArgumentException.ThrowIfNullOrWhiteSpace(inputs.RunId);

        SponsorPacketBuyerDecisionBriefSections.PackManifestSummary manifest = ParseManifest(inputs.PackManifestJson);
        SponsorPacketBuyerDecisionBriefSections.SponsorReport sponsor = ParseSponsorReport(inputs.SponsorReportJson);
        SponsorPacketBuyerDecisionBriefSections.LimitationsSummary limitations = ParseLimitations(inputs.LimitationsMd);
        string? valueParagraph = ExtractFirstValueParagraph(inputs.FirstValueReportMd);
        string? executionProvenance = ExtractExecutionProvenanceLine(inputs.FirstValueReportMd);
        string disposition = SponsorPacketBuyerDecisionBriefSections.DeriveDisposition(manifest, limitations);

        return RenderBrief(inputs.RunId, disposition, manifest, sponsor, limitations, valueParagraph, executionProvenance);
    }

    /// <summary>Convenience overload that reads files from <paramref name="packetDirectory"/>.</summary>
    public static string BuildFromDirectory(string packetDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(packetDirectory);

        string? manifestJson = BuyerPacketFolderWriter.TryReadText(
            Path.Combine(packetDirectory, SponsorPacketArtifactCatalog.PackManifestFileName));
        string? SponsorReportJson = BuyerPacketFolderWriter.TryReadText(
            Path.Combine(packetDirectory, SponsorPacketArtifactCatalog.SponsorReportFileName));
        string? limitationsMd = BuyerPacketFolderWriter.TryReadText(Path.Combine(packetDirectory, "limitations.md"));
        string? firstValueReportMd = BuyerPacketFolderWriter.TryReadText(
            Path.Combine(packetDirectory, SponsorPacketArtifactCatalog.FirstValueReportFileName));
        string runId = ExtractRunIdFromManifest(manifestJson) ?? Path.GetFileName(packetDirectory.TrimEnd(Path.DirectorySeparatorChar));

        return Build(new BriefInputs(runId, manifestJson, SponsorReportJson, limitationsMd, firstValueReportMd));
    }

    /// <summary>Pure inputs for <see cref="Build"/>; all file content strings are optional.</summary>
    public sealed record BriefInputs(
        string RunId,
        string? PackManifestJson,
        string? SponsorReportJson,
        string? LimitationsMd,
        string? FirstValueReportMd);
}
