using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotRoiEvidenceConfidenceHonestyCopy
{
    internal const string PartialOrLowSponsorWordingPlain =
        "**Tenant comparative baseline is incomplete or defaulted** — keep sponsor wording qualitative and avoid bespoke dollar narratives.";

    internal static string FormatProofPackageCell(PilotRoiEvidenceConfidence confidence, string? roiConfidenceLabel)
    {
        string label = string.IsNullOrWhiteSpace(roiConfidenceLabel)
            ? "ROI confidence label was not stored."
            : FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(roiConfidenceLabel.Trim());

        string core = FormattableString.Invariant($"**{confidence}** — {label}");

        return confidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low
            ? FormattableString.Invariant($"{core}; {PartialOrLowSponsorWordingPlain}")
            : core;
    }

    internal static string FormatSponsorSafeConcreteGapLineWhenPartialOrLow() => PartialOrLowSponsorWordingPlain;

    internal static string EnsurePartialOrLowSponsorWording(PilotRoiEvidenceConfidence confidence, string cell)
    {
        if (confidence is not (PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low))
            return cell;

        return cell.Contains(PartialOrLowSponsorWordingPlain, StringComparison.Ordinal)
            ? cell
            : FormattableString.Invariant($"{cell}; {PartialOrLowSponsorWordingPlain}");
    }
}
