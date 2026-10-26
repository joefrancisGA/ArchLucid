using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Manifests;

/// <summary>Honest prose labels for markdown manifest summaries (stored links vs observed actions).</summary>
public static class ArchitectureManifestMarkdownSummaryExport
{
    public const string SystemNameNotStored = "System name was not stored.";

    public const string PurposeNotRecorded = "Purpose was not recorded.";

    public const string ManifestVersionNotStored = "Manifest version was not stored.";

    public static string FormatSystemNameForSummary(string? systemName) =>
        string.IsNullOrWhiteSpace(systemName) ? SystemNameNotStored : systemName.Trim();

    public static string FormatRelationshipTypeForSummary(RelationshipType relationshipType) =>
        relationshipType switch
        {
            RelationshipType.Calls =>
                "has a stored call link. Observed invocation was not stored.",
            RelationshipType.ReadsFrom =>
                "has a stored read link. An observed read was not stored.",
            RelationshipType.WritesTo =>
                "has a stored write link. An observed write was not stored.",
            RelationshipType.PublishesTo =>
                "has a stored publish link. Observed delivery was not stored.",
            RelationshipType.SubscribesTo =>
                "has a stored subscription link. Observed consumption was not stored.",
            RelationshipType.AuthenticatesWith =>
                "has a stored authentication link. Observed sign-in was not stored.",
            _ => $"has a stored {relationshipType} link. Observed action was not stored.",
        };
}
