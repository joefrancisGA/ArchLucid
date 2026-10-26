namespace ArchLucid.ArtifactSynthesis.Packaging;

internal static class ExportManifestHonestyCopy
{
    internal const string CommittedManifestHashNotStored = "Committed manifest hash was not stored.";
    internal const string CommittedManifestHashStoredEmpty = "Committed manifest hash was stored empty.";
    internal const string RuleSetIdNotStored = "Rule set id was not stored.";
    internal const string RuleSetIdStoredEmpty = "Rule set id was stored empty.";
    internal const string RuleSetHashNotStored = "Rule set hash was not stored.";
    internal const string RuleSetHashStoredEmpty = "Rule set hash was stored empty.";

    internal static string FormatCommittedManifestHash(string? raw) => FormatOptionalAnchor(raw, CommittedManifestHashNotStored, CommittedManifestHashStoredEmpty);

    internal static string FormatRuleSetId(string? raw) => FormatOptionalAnchor(raw, RuleSetIdNotStored, RuleSetIdStoredEmpty);

    internal static string FormatRuleSetHash(string? raw) => FormatOptionalAnchor(raw, RuleSetHashNotStored, RuleSetHashStoredEmpty);

    private static string FormatOptionalAnchor(string? raw, string notStored, string storedEmpty)
    {
        if (raw is null)
        {
            return notStored;
        }

        if (raw.Length == 0 || string.IsNullOrWhiteSpace(raw))
        {
            return storedEmpty;
        }

        return raw.Trim();
    }
}
