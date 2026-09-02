namespace ArchLucid.Cli.Commands.PilotReadiness;

internal abstract class PilotReadinessSlotRunnerBase
{
    internal static PilotReadinessBundleSlotResult BuildSlotResult(
        string slotKey,
        string displayName,
        PilotReadinessBundleSlotVerdict verdict,
        string evidence,
        string? jsonArtifactPath,
        string? markdownArtifactPath,
        string? sponsorMarkdownArtifactPath = null) =>
        new()
        {
            SlotKey = slotKey,
            DisplayName = displayName,
            Verdict = verdict,
            Evidence = evidence,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
            SponsorMarkdownArtifactPath = sponsorMarkdownArtifactPath,
        };
}
