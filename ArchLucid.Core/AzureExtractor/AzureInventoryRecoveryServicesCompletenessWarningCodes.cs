namespace ArchLucid.Core.AzureExtractor;

/// <summary>Completeness warnings when Recovery Services child APIs fail (RSV-03).</summary>
public static class AzureInventoryRecoveryServicesCompletenessWarningCodes
{
    public const string ProtectedItemsMissing = "recovery-services-protected-items-missing";

    public const string BackupListFailedPrefix = "recovery-services-backup-list-failed:";

    public const string SiteRecoveryListFailedPrefix = "recovery-services-site-recovery-list-failed:";
}
