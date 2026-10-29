using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Manifests;

/// <summary>Honest prose labels for markdown manifest summaries (stored links vs observed actions).</summary>
public static class ArchitectureManifestMarkdownSummaryExport
{
    public const string SystemNameNotStored = "System name was not stored.";

    public const string PurposeNotRecorded = "Purpose was not recorded.";

    public const string ManifestVersionNotStored = "Manifest version was not stored.";

    public static string FormatManifestVersionForSummary(string? manifestVersion) =>
        string.IsNullOrWhiteSpace(manifestVersion) ? ManifestVersionNotStored : manifestVersion.Trim();

    public const string ComponentNameNotStored = "Component name was not stored.";

    public const string ServiceNameNotStored = "Service name was not stored.";

    public const string DatastoreNameNotStored = "Datastore name was not stored.";

    public const string RelationshipDescriptionNotStored = "Relationship description was not stored.";

    public const string RelationshipTypeNotStored = "Relationship type was not stored.";

    public const string RelationshipEndpointNotStored = "Relationship endpoint was not stored.";

    public const string ServicesNotListedOnSnapshot = "Services were not listed on this snapshot.";

    public const string DatastoresNotListedOnSnapshot = "Datastores were not listed on this snapshot.";

    public const string RelationshipsNotListedOnSnapshot = "Relationships were not listed on this snapshot.";

    public const string ParentManifestVersionNotStored = "Parent manifest version was not stored.";

    public const string ChangeDescriptionNotStored = "Change description was not stored.";

    public const string ChangeDescriptionStoredEmpty = "Change description was stored empty.";

    public const string ParentManifestVersionStoredEmpty = "Parent manifest version was stored empty.";

    public const string CreatedTimeNotStored = "Created time was not stored.";

    public const string DecisionTraceCountNotStored = "Decision trace count was not stored.";

    public const string RequiredControlsNotStored = "Required controls were not stored.";

    public const string TagsNotStored = "Tags were not stored.";

    public const string PurposeNotStored = "Purpose was not stored.";

    public static string FormatSystemNameForSummary(string? systemName) =>
        string.IsNullOrWhiteSpace(systemName) ? SystemNameNotStored : systemName.Trim();

    public static string FormatServiceNameForSummary(string? serviceName) =>
        string.IsNullOrWhiteSpace(serviceName) ? ServiceNameNotStored : serviceName.Trim();

    public static string FormatDatastoreNameForSummary(string? datastoreName) =>
        string.IsNullOrWhiteSpace(datastoreName) ? DatastoreNameNotStored : datastoreName.Trim();

    public static string FormatSnapshotServiceCountPhrase(int count) =>
        count == 0 ? ServicesNotListedOnSnapshot : $"{count} service(s)";

    public static string FormatSnapshotDatastoreCountPhrase(int count) =>
        count == 0 ? DatastoresNotListedOnSnapshot : $"{count} datastore(s)";

    public static string FormatSnapshotRelationshipCountPhrase(int count) =>
        count == 0 ? RelationshipsNotListedOnSnapshot : $"{count} relationship(s)";

    public static string FormatManifestCollectionCountLabel(string countLabel, int count) =>
        count == 0
            ? countLabel switch
            {
                "Service" => ServicesNotListedOnSnapshot,
                "Datastore" => DatastoresNotListedOnSnapshot,
                "Relationship" => RelationshipsNotListedOnSnapshot,
                _ => $"{countLabel} count was not stored on this snapshot.",
            }
            : $"{countLabel} Count: {count}";

    public static string FormatRelationshipTypeForSummary(RelationshipType relationshipType)
    {
        if (!Enum.IsDefined(relationshipType))
        {
            return RelationshipTypeNotStored;
        }

        return relationshipType switch
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
            _ => RelationshipTypeNotStored,
        };
    }
}
