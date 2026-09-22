namespace ArchLucid.Core.Audit;

// Infrastructure-evidence plane: Azure inventory snapshots, audit catalogs, tenant branding.
public static partial class AuditEventTypes
{
    /// <summary>Pending Azure inventory snapshot header created for an extractor package.</summary>
    public const string AzureInventorySnapshotCreated = "AzureInventorySnapshot.Created";

    /// <summary>Azure inventory snapshot header creation failed after package ingest.</summary>
    public const string AzureInventorySnapshotFailed = "AzureInventorySnapshot.Failed";

    /// <summary>Operator deleted an Azure inventory snapshot and its derived IE-plane rows.</summary>
    public const string AzureInventorySnapshotDeleted = "AzureInventorySnapshot.Deleted";

    /// <summary>Versioned audit framework catalog imported for a tenant.</summary>
    public const string AuditFrameworkImported = "AuditFramework.Imported";

    /// <summary>Tenant branding profile created or updated.</summary>
    public const string TenantBrandingProfileChanged = "TenantBrandingProfile.Changed";

    /// <summary>Tenant branding draft activated for operator surfaces and exports.</summary>
    public const string TenantBrandingProfileActivated = "TenantBrandingProfile.Activated";

    /// <summary>Tenant branding reverted to ArchLucid product defaults.</summary>
    public const string TenantBrandingProfileReverted = "TenantBrandingProfile.Reverted";

    /// <summary>Tenant brand asset uploaded (SVG/PNG/JPEG).</summary>
    public const string TenantBrandAssetUploaded = "TenantBrandAsset.Uploaded";

    /// <summary>Operational security finding ingested or updated from an external source.</summary>
    public const string OperationalSecurityFindingIngested = "OperationalSecurityFinding.Ingested";

    /// <summary>Operational security finding re-ingested with an identical payload (deduplicated).</summary>
    public const string OperationalSecurityFindingDeduplicated = "OperationalSecurityFinding.Deduplicated";

    /// <summary>Operational security exception created for a finding, pattern, or cloud resource.</summary>
    public const string OperationalSecurityExceptionCreated = "OperationalSecurityException.Created";

    /// <summary>Operational security exception revoked before expiration.</summary>
    public const string OperationalSecurityExceptionRevoked = "OperationalSecurityException.Revoked";

    /// <summary>Operational security exception expired and visibility was reopened.</summary>
    public const string OperationalSecurityExceptionExpired = "OperationalSecurityException.Expired";

    /// <summary>Remediation instance created from an approved pattern match.</summary>
    public const string RemediationInstanceCreated = "RemediationInstance.Created";

    /// <summary>Remediation instance executed (advisory emit only; no cloud apply).</summary>
    public const string RemediationInstanceExecuted = "RemediationInstance.Executed";

    /// <summary>Remediation instance closed after successful verification.</summary>
    public const string RemediationInstanceClosed = "RemediationInstance.Closed";

    /// <summary>SecureNow architect neighborhood path recompute after IE-06 diff (SA-13).</summary>
    public const string SecureNowArchitectNeighborhoodRecomputed = "SecureNowArchitect.NeighborhoodRecomputed";

    /// <summary>Human security asset assertion created (SA-18).</summary>
    public const string SecurityAssetAssertionCreated = "SecurityAssetAssertion.Created";

    /// <summary>Human security asset assertion renewed before expiration (SA-18).</summary>
    public const string SecurityAssetAssertionRenewed = "SecurityAssetAssertion.Renewed";

    /// <summary>Human security asset assertion revoked before expiration (SA-18).</summary>
    public const string SecurityAssetAssertionRevoked = "SecurityAssetAssertion.Revoked";

    /// <summary>Human security asset assertion expired; crown-jewel linkage decays (SA-18).</summary>
    public const string SecurityAssetAssertionExpired = "SecurityAssetAssertion.Expired";

    /// <summary>Human declared resource connection created.</summary>
    public const string SecurityDeclaredConnectionCreated = "SecurityDeclaredConnection.Created";

    /// <summary>Human declared resource connection renewed before expiration.</summary>
    public const string SecurityDeclaredConnectionRenewed = "SecurityDeclaredConnection.Renewed";

    /// <summary>Human declared resource connection revoked before expiration.</summary>
    public const string SecurityDeclaredConnectionRevoked = "SecurityDeclaredConnection.Revoked";

    /// <summary>Human declared resource connection expired.</summary>
    public const string SecurityDeclaredConnectionExpired = "SecurityDeclaredConnection.Expired";

    /// <summary>Operator confirmed an inferred runtime connection proposal.</summary>
    public const string OperatorInferredConnectionConfirmed = "OperatorInferredConnection.Confirmed";

    /// <summary>Operator dismissed an inferred runtime connection proposal.</summary>
    public const string OperatorInferredConnectionDismissed = "OperatorInferredConnection.Dismissed";
}
