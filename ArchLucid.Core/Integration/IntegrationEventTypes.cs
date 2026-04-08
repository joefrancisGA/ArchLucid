namespace ArchLucid.Core.Integration;

/// <summary>Logical integration event type strings published to Service Bus (<see cref="IIntegrationEventPublisher"/>).</summary>
/// <remarks>
/// Canonical strings use <c>com.archlucid.*</c>. Legacy <c>com.archiforge.*</c> aliases are retained so in-process consumers
/// and external subscribers can transition without dropping messages.
/// </remarks>
public static class IntegrationEventTypes
{
    public const string AuthorityRunCompletedV1 = "com.archlucid.authority.run.completed";

    public const string AuthorityRunCompletedLegacyV1 = "com.archiforge.authority.run.completed";

    public const string GovernanceApprovalSubmittedV1 = "com.archlucid.governance.approval.submitted";

    public const string GovernanceApprovalSubmittedLegacyV1 = "com.archiforge.governance.approval.submitted";

    public const string GovernancePromotionActivatedV1 = "com.archlucid.governance.promotion.activated";

    public const string GovernancePromotionActivatedLegacyV1 = "com.archiforge.governance.promotion.activated";

    public const string AlertFiredV1 = "com.archlucid.alert.fired";

    public const string AlertFiredLegacyV1 = "com.archiforge.alert.fired";

    public const string AlertResolvedV1 = "com.archlucid.alert.resolved";

    public const string AlertResolvedLegacyV1 = "com.archiforge.alert.resolved";

    public const string AdvisoryScanCompletedV1 = "com.archlucid.advisory.scan.completed";

    public const string AdvisoryScanCompletedLegacyV1 = "com.archiforge.advisory.scan.completed";

    /// <summary>Wildcard handler: receives every event type after no specific handler matched.</summary>
    public const string WildcardEventType = "*";

    /// <summary>Maps a legacy or canonical type string to the canonical <c>com.archlucid.*</c> value when known.</summary>
    public static string MapToCanonical(string eventType)
    {
        if (string.IsNullOrWhiteSpace(eventType))
        {
            return string.Empty;
        }

        return eventType.Trim() switch
        {
            AuthorityRunCompletedLegacyV1 => AuthorityRunCompletedV1,
            GovernanceApprovalSubmittedLegacyV1 => GovernanceApprovalSubmittedV1,
            GovernancePromotionActivatedLegacyV1 => GovernancePromotionActivatedV1,
            AlertFiredLegacyV1 => AlertFiredV1,
            AlertResolvedLegacyV1 => AlertResolvedV1,
            AdvisoryScanCompletedLegacyV1 => AdvisoryScanCompletedV1,
            _ => eventType.Trim(),
        };
    }

    /// <summary>True when both strings refer to the same logical event (canonical or legacy alias).</summary>
    public static bool AreEquivalent(string a, string b)
    {
        if (string.IsNullOrWhiteSpace(a) || string.IsNullOrWhiteSpace(b))
        {
            return false;
        }

        string ca = MapToCanonical(a);
        string cb = MapToCanonical(b);

        return string.Equals(ca, cb, StringComparison.Ordinal);
    }
}
