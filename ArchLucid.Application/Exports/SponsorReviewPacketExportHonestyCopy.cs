namespace ArchLucid.Application.Exports;

internal static class SponsorReviewPacketExportHonestyCopy
{
    internal const string DecisionTitleNotStored = "Decision title was not stored.";
    internal const string SelectedOptionNotStored = "Selected option was not stored.";
    internal const string NextActionNotStored = "Next action was not stored.";
    internal const string PortfolioSignalsNotStored = "Portfolio signals were not stored.";
    internal const string ConfidenceNotStored = "Confidence was not stored.";
    internal const string EvidenceLinkNotStored = "Evidence link was not stored.";

    internal static string FormatDecisionTitle(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? DecisionTitleNotStored : raw.Trim();

    internal static string FormatSelectedOption(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? SelectedOptionNotStored : raw.Trim();
}
