namespace ArchLucid.Core.Authorization;

/// <summary>
///     Atomic permission strings for fine-grained RBAC. Values are persisted in <c>dbo.CustomRoles.PermissionsJson</c>
///     and emitted as <c>archlucid:permission</c> claims when a principal has an assigned custom role.
/// </summary>
public static class Permissions
{
    /// <summary>Read run summaries, manifests, and run detail within tenant scope.</summary>
    public const string RunsRead = "Runs.Read";

    /// <summary>Create architecture review requests (<c>POST /v1/architecture/request</c>).</summary>
    public const string RunsCreate = "Runs.Create";

    /// <summary>Commit / finalize runs and mutate committed authority state.</summary>
    public const string RunsCommit = "Runs.Commit";

    /// <summary>Delete or archive runs when supported by tenant policy.</summary>
    public const string RunsDelete = "Runs.Delete";

    /// <summary>Read findings snapshots and per-finding inspect surfaces.</summary>
    public const string FindingsRead = "Findings.Read";

    /// <summary>Submit operator feedback (thumbs up/down) on findings.</summary>
    public const string FindingsFeedback = "Findings.Feedback";

    /// <summary>Read governance posture, policy assignments, and drift summaries.</summary>
    public const string GovernanceRead = "Governance.Read";

    /// <summary>Simulate policy packs without activation.</summary>
    public const string GovernanceSimulatePolicy = "Governance.SimulatePolicy";

    /// <summary>Activate or assign policy packs for the tenant workspace.</summary>
    public const string GovernanceActivatePolicy = "Governance.ActivatePolicy";

    /// <summary>Author and edit tenant policy pack definitions.</summary>
    public const string PolicyPacksAuthor = "PolicyPacks.Author";

    /// <summary>Search and read durable audit events within scope.</summary>
    public const string AuditRead = "Audit.Read";

    /// <summary>Export audit trails (CSV / bulk export endpoints).</summary>
    public const string AuditExport = "Audit.Export";

    /// <summary>Read own tenant metadata and settings.</summary>
    public const string TenantsReadOwn = "Tenants.ReadOwn";

    /// <summary>Update own tenant settings (non-billing).</summary>
    public const string TenantsManageOwn = "Tenants.ManageOwn";

    /// <summary>Cross-tenant administration (platform operator only).</summary>
    public const string TenantsManageAny = "Tenants.ManageAny";

    /// <summary>Read billing subscription and usage summaries.</summary>
    public const string BillingRead = "Billing.Read";

    /// <summary>Manage billing checkout and subscription changes.</summary>
    public const string BillingManage = "Billing.Manage";

    /// <summary>Configure SSO / identity provider rows for the tenant.</summary>
    public const string IdentityManageProviders = "Identity.ManageProviders";

    /// <summary>Configure outbound integrations (webhooks, ITSM, Teams).</summary>
    public const string IntegrationsConfigure = "Integrations.Configure";

    /// <summary>Generate support bundles for diagnostics.</summary>
    public const string SupportGenerateBundle = "Support.GenerateBundle";

    /// <summary>Access the admin console and tenant admin APIs.</summary>
    public const string AdminConsoleAccess = "AdminConsole.Access";

    /// <summary>Claim type used when projecting custom-role permissions onto the principal.</summary>
    public const string ClaimType = "archlucid:permission";

    /// <summary>All known permission values (for validation on write).</summary>
    public static IReadOnlyList<string> All { get; } =
    [
        RunsRead,
        RunsCreate,
        RunsCommit,
        RunsDelete,
        FindingsRead,
        FindingsFeedback,
        GovernanceRead,
        GovernanceSimulatePolicy,
        GovernanceActivatePolicy,
        PolicyPacksAuthor,
        AuditRead,
        AuditExport,
        TenantsReadOwn,
        TenantsManageOwn,
        TenantsManageAny,
        BillingRead,
        BillingManage,
        IdentityManageProviders,
        IntegrationsConfigure,
        SupportGenerateBundle,
        AdminConsoleAccess,
    ];

    private static readonly HashSet<string> AllSet = new(All, StringComparer.Ordinal);

    /// <summary>Built-in Admin effective permission set (mirrors legacy Admin JWT behaviour).</summary>
    public static IReadOnlyList<string> BuiltInAdmin { get; } = All.ToList();

    /// <summary>Built-in Operator effective permission set.</summary>
    public static IReadOnlyList<string> BuiltInOperator { get; } =
    [
        RunsRead,
        RunsCreate,
        RunsCommit,
        FindingsRead,
        FindingsFeedback,
        GovernanceRead,
        GovernanceSimulatePolicy,
        PolicyPacksAuthor,
        AuditRead,
        TenantsReadOwn,
        IntegrationsConfigure,
        SupportGenerateBundle,
    ];

    /// <summary>Built-in Reader effective permission set.</summary>
    public static IReadOnlyList<string> BuiltInReader { get; } =
    [
        RunsRead,
        FindingsRead,
        GovernanceRead,
        AuditRead,
        TenantsReadOwn,
    ];

    /// <summary>Built-in Auditor effective permission set.</summary>
    public static IReadOnlyList<string> BuiltInAuditor { get; } =
    [
        RunsRead,
        FindingsRead,
        GovernanceRead,
        AuditRead,
        AuditExport,
        TenantsReadOwn,
    ];

    public static bool IsKnown(string? permission) =>
        !string.IsNullOrWhiteSpace(permission) && AllSet.Contains(permission);

    public static IReadOnlyList<string> ValidateAndNormalize(IEnumerable<string>? permissions)
    {
        if (permissions is null)
            throw new ArgumentException("permissions is required.", nameof(permissions));

        List<string> normalized = [];
        HashSet<string> seen = new(StringComparer.Ordinal);

        foreach (string raw in permissions)
        {
            if (string.IsNullOrWhiteSpace(raw))
                continue;

            string trimmed = raw.Trim();

            if (!IsKnown(trimmed))
                throw new ArgumentException($"Unknown permission '{trimmed}'.", nameof(permissions));

            if (seen.Add(trimmed))
                normalized.Add(trimmed);
        }

        return normalized;
    }
}
