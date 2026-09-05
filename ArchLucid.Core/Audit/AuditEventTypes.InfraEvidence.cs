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
}
