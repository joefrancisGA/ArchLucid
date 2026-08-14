namespace ArchLucid.Core.Audit;

// Tenant provisioning, suspension, erasure, catalog migration, projects, trials, billing, and tenant settings.
public static partial class AuditEventTypes
{
    /// <summary>SaaS tenant registry: new tenant + default workspace identifiers created (or idempotent replay).</summary>
    public const string TenantProvisioned = "TenantProvisioned";

    /// <summary>
    ///     Public self-service registration completed (audit complements <see cref="TenantProvisioned" /> on the same
    ///     flow).
    /// </summary>
    public const string TenantSelfRegistered = "TenantSelfRegistered";

    /// <summary>Platform audit: tenant surface suspended (<c>dbo.Tenants.SuspendedUtc</c> set) without erasure quarantine.</summary>
    public const string TenantSuspended = "TenantSuspended";

    /// <summary>Platform audit: tenant surface resumed after admin suspend (<c>SuspendedUtc</c> cleared).</summary>
    public const string TenantUnsuspended = "TenantUnsuspended";

    /// <summary>Platform audit: tenant catalog migration fan-out started (scope freeze / writes suspended).</summary>
    public const string TenantCatalogMigrationStarted = "TenantCatalogMigrationStarted";

    /// <summary>Platform audit: catalog attach/detach acknowledged before projection refresh.</summary>
    public const string TenantCatalogMigrationCatalogAttachAcknowledged = "TenantCatalogMigrationCatalogAttachAcknowledged";

    /// <summary>Platform audit: post-cutover projection refresh orchestration completed for a catalog migration.</summary>
    public const string TenantCatalogMigrationProjectionRefreshCompleted = "TenantCatalogMigrationProjectionRefreshCompleted";

    /// <summary>Platform audit: automated migration verification probe passed before reopening writes.</summary>
    public const string TenantCatalogMigrationVerificationPassed = "TenantCatalogMigrationVerificationPassed";

    /// <summary>Platform audit: automated migration verification probe failed.</summary>
    public const string TenantCatalogMigrationVerificationFailed = "TenantCatalogMigrationVerificationFailed";

    /// <summary>Platform audit: tenant catalog migration completed and writes reopened.</summary>
    public const string TenantCatalogMigrationCompleted = "TenantCatalogMigrationCompleted";

    /// <summary>
    ///     Platform audit (<c>dbo.PlatformAuditEvents</c>): tenant offboarding removed tenant-scoped SQL + blobs; not
    ///     written to <c>dbo.AuditEvents</c>.
    /// </summary>
    public const string TenantDataDeleted = "TenantDataDeleted";

    /// <summary>Platform audit: tenant entered scheduled erasure quarantine (<c>dbo.Tenants.OffboardedUtc</c> set).</summary>
    public const string TenantErasureOffboarded = "TenantErasureOffboarded";

    public const string TenantErasureApproved = "TenantErasureApproved";

    /// <summary>Platform audit: quarantine cleared before hard purge (break-glass restore).</summary>
    public const string TenantErasureQuarantineRestored = "TenantErasureQuarantineRestored";

    /// <summary>Platform audit: legal/regulatory hold placed or extended on a tenant.</summary>
    public const string TenantErasureLegalHoldSet = "TenantErasureLegalHoldSet";

    /// <summary>Platform audit: legal hold cleared by a platform operator.</summary>
    public const string TenantErasureLegalHoldCleared = "TenantErasureLegalHoldCleared";

    /// <summary>Architecture project soft-deleted (<c>dbo.Projects.IsDeleted = 1</c>) via tenant API.</summary>
    public const string ArchitectureProjectSoftDeleted = "ArchitectureProjectSoftDeleted";

    /// <summary>Architecture project restored from recycle bin (<c>dbo.Projects.IsDeleted</c> 1→0) via tenant API.</summary>
    public const string ArchitectureProjectRestored = "ArchitectureProjectRestored";

    /// <summary>Retention job hard-deleted a soft-deleted <c>dbo.Projects</c> row (payload: project id).</summary>
    public const string ArchitectureProjectHardPurgedRetention = "ArchitectureProjectHardPurgedRetention";

    /// <summary>
    ///     Platform audit: sample-marked runs purged after first real commit or TTL (payload: row counts only — no tenant id).
    /// </summary>
    public const string SampleRunsPurged = "SampleRunsPurged";

    /// <summary>Self-service trial activated with sample data (demo seed + trial window metadata).</summary>
    public const string TrialProvisioned = "TrialProvisioned";

    /// <summary>Trial marked converted (billing integration stub).</summary>
    public const string TenantTrialConverted = "TenantTrialConverted";

    /// <summary>
    ///     Commercial Entra directory (<c>tid</c>) bound to an ArchLucid tenant after paid conversion
    ///     (<c>POST /v1/tenant/link-entra</c>).
    /// </summary>
    public const string TenantEntraDirectoryBound = "TenantEntraDirectoryBound";

    /// <summary>Optional: trial local <c>dbo.IdentityUsers</c> row linked to an Entra <c>oid</c> during handoff.</summary>
    public const string TrialLocalIdentityLinkedToEntra = "TrialLocalIdentityLinkedToEntra";

    /// <summary>
    ///     Automated trial lifecycle state transition (Worker scheduler; SQL row in <c>dbo.TenantLifecycleTransitions</c>
    ///     ).
    /// </summary>
    public const string TrialLifecycleTransition = "TrialLifecycleTransition";

    /// <summary>Emitted when a mutating request is blocked because the tenant trial expired or exceeded runs/seats (HTTP 402).</summary>
    public const string TrialLimitExceeded = "TrialLimitExceeded";

    /// <summary>Self-service signup or local trial identity registration attempt observed at HTTP entry (funnel top).</summary>
    public const string TrialSignupAttempted = "TrialSignupAttempted";

    /// <summary>Signup or trial bootstrap failed after <see cref="TrialSignupAttempted" /> (payload includes stage/reason).</summary>
    public const string TrialSignupFailed = "TrialSignupFailed";

    /// <summary>
    ///     Durable failure on <c>POST /v1/register</c> (validation, duplicate org, or unexpected server error). Payload
    ///     includes <c>reason</c> and optional <c>message</c>.
    /// </summary>
    public const string TrialRegistrationFailed = "TrialRegistrationFailed";

    /// <summary>Prospect supplied optional review-cycle baseline hours at trial signup (persisted on <c>dbo.Tenants</c>).</summary>
    public const string TrialBaselineReviewCycleCaptured = "TrialBaselineReviewCycleCaptured";

    /// <summary>Operator updated review-cycle baseline hours after an earlier capture (settings / wizard).</summary>
    public const string TrialBaselineReviewCycleUpdated = "TrialBaselineReviewCycleUpdated";

    /// <summary>First save of <c>BaselineManualPrep*</c> on <c>dbo.Tenants</c> (settings or migration from prior null).</summary>
    public const string TrialBaselineManualPrepCaptured = "TrialBaselineManualPrepCaptured";

    /// <summary>Subsequent edits to <c>BaselineManualPrep*</c> after the first capture.</summary>
    public const string TrialBaselineManualPrepUpdated = "TrialBaselineManualPrepUpdated";

    /// <summary>Operator saved per-tenant ROI cost assumptions on <c>dbo.TenantCostSettings</c>.</summary>
    public const string TenantCostSettingsUpdated = "TenantCostSettingsUpdated";

    /// <summary>Workspace owner updated the featured completed sample on operator home.</summary>
    public const string TenantHomepageSettingsUpdated = "TenantHomepageSettingsUpdated";

    /// <summary>Operator shell showed the usage-based trial upgrade nudge (payload includes <c>trigger</c>).</summary>
    public const string TrialUpgradeNudgeShown = "TrialUpgradeNudgeShown";

    /// <summary>Operator clicked the usage-based trial upgrade nudge CTA (payload includes <c>trigger</c>).</summary>
    public const string TrialUpgradeNudgeClicked = "TrialUpgradeNudgeClicked";

    /// <summary>Operator shell showed the paid Team expansion nudge (payload includes <c>trigger</c>).</summary>
    public const string TeamExpansionNudgeShown = "TeamExpansionNudgeShown";

    /// <summary>Operator clicked the paid Team expansion nudge CTA (payload includes <c>trigger</c>).</summary>
    public const string TeamExpansionNudgeClicked = "TeamExpansionNudgeClicked";

    /// <summary>First golden manifest commit recorded for a self-service trial tenant (funnel depth).</summary>
    public const string TrialFirstRunCompleted = "TrialFirstRunCompleted";

    /// <summary>Trial architecture pre-seed exhausted attempts without delivering a welcome run (TB-258).</summary>
    public const string TrialArchitecturePreseedFailed = "TrialArchitecturePreseedFailed";

    /// <summary>Admin initiated hosted billing checkout for trial conversion.</summary>
    public const string BillingCheckoutInitiated = "BillingCheckoutInitiated";

    /// <summary>Hosted billing checkout session created successfully (payload may include provider session id).</summary>
    public const string BillingCheckoutCompleted = "BillingCheckoutCompleted";

    /// <summary>Admin initiated Stripe Billing Portal session for self-serve billing management.</summary>
    public const string BillingPortalInitiated = "BillingPortalInitiated";

    /// <summary>Stripe Billing Portal session created successfully (payload may include provider session id).</summary>
    public const string BillingPortalCompleted = "BillingPortalCompleted";

    /// <summary>Stripe subscription moved to Suspended (dunning / payment failure) via webhook.</summary>
    public const string BillingSubscriptionSuspended = "BillingSubscriptionSuspended";

    /// <summary>Stripe subscription returned to Active after successful payment via webhook.</summary>
    public const string BillingSubscriptionReinstated = "BillingSubscriptionReinstated";

    /// <summary>Stripe subscription canceled or deleted via webhook.</summary>
    public const string BillingSubscriptionCanceled = "BillingSubscriptionCanceled";

    /// <summary>
    ///     Tenant-level customer notification channel toggles updated (
    ///     <c>PUT /v1/notifications/customer-channel-preferences</c>).
    /// </summary>
    public const string TenantNotificationChannelPreferencesUpdated = "TenantNotificationChannelPreferencesUpdated";

    /// <summary>
    ///     Tenant architecture review board cover logo replaced (
    ///     <c>POST /v1/admin/tenant/logo</c>). Payload excludes image bytes.
    /// </summary>
    public const string TenantReviewBoardCoverLogoUploaded = "Tenant.ReviewBoardCoverLogoUploaded";

    /// <summary>Tenant weekly sponsor digest preferences updated (<c>POST /v1/tenant/exec-digest-preferences</c>).</summary>
    public const string ExecDigestPreferencesUpdated = "ExecDigestPreferencesUpdated";

    /// <summary>Tenant sponsor digest preferences updated (<c>PUT /v1/tenant/sponsor-digest-preferences</c>).</summary>
    public const string SponsorDigestPreferencesUpdated = "SponsorDigestPreferencesUpdated";
}
