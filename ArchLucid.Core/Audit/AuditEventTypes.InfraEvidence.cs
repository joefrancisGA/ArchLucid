namespace ArchLucid.Core.Audit;

// Infrastructure-evidence plane: Azure inventory snapshots, audit catalogs, tenant branding.
public static partial class AuditEventTypes
{
    /// <summary>Pending Azure inventory snapshot header created for an extractor package.</summary>
    public const string AzureInventorySnapshotCreated = "AzureInventorySnapshot.Created";

    /// <summary>Azure inventory snapshot header creation failed after package ingest.</summary>
    public const string AzureInventorySnapshotFailed = "AzureInventorySnapshot.Failed";

    /// <summary>Versioned audit framework catalog imported for a tenant.</summary>
    public const string AuditFrameworkImported = "AuditFramework.Imported";

    /// <summary>Tenant branding profile created or updated.</summary>
    public const string TenantBrandingProfileChanged = "TenantBrandingProfile.Changed";

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
}
