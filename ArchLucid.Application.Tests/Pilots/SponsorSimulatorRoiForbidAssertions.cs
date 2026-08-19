using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

/// <summary>
///     TB-985 — asserts sponsor lead zones do not present annualized/projected USD on Simulator-only or HOLD postures.
/// </summary>
internal static class SponsorSimulatorRoiForbidAssertions
{
    private const string ReviewCycleDeltaHeading = "## Review-cycle delta (before vs measured)";

    private static readonly Regex LeadingDollarAmount = new(
        @"\$\s*[\d,]+(?:\.\d+)?",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex AnnualizedUsdLeadLine = new(
        @"(?:Annualized hours value|Net annualized value vs baseline|Annualized LLM cost)\s*\(USD\):\s*[\d.]+\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    internal static string ExtractSponsorLeadZone(string markdown)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(markdown);

        int reviewCycleHeading = markdown.IndexOf(ReviewCycleDeltaHeading, StringComparison.Ordinal);

        return reviewCycleHeading > 0
            ? markdown[..reviewCycleHeading]
            : markdown;
    }

    internal static void AssertNoLeadingAnnualizedOrProjectedUsd(string markdown)
    {
        string zone = ExtractSponsorLeadZone(markdown);

        LeadingDollarAmount.Matches(zone).Should().BeEmpty(
            because: "sponsor lead zone must not contain leading projected USD under Simulator-only or HOLD (TB-985 / TB-983)");

        AnnualizedUsdLeadLine.Matches(zone).Should().BeEmpty(
            because: "sponsor lead zone must not contain annualized USD lead lines under Simulator-only or HOLD (TB-985 / TB-983)");
    }

    internal static void AssertDocxHoldSuppressesAnnualizedUsd(byte[] docx)
    {
        ArgumentNullException.ThrowIfNull(docx);

        string xml = ReadDocumentXml(docx);

        xml.Should().Contain("Annualized USD and ROI percentage lines suppressed");
        xml.Should().NotContain("Annualized hours value (USD):");
        xml.Should().NotContain("Net annualized value vs baseline (USD):");
    }

    private static string ReadDocumentXml(byte[] docx)
    {
        using MemoryStream ms = new(docx);
        using ZipArchive zip = new(ms, ZipArchiveMode.Read);
        ZipArchiveEntry? entry = zip.GetEntry("word/document.xml");
        entry.Should().NotBeNull();

        using StreamReader reader = new(entry!.Open(), Encoding.UTF8);

        return reader.ReadToEnd();
    }
}
