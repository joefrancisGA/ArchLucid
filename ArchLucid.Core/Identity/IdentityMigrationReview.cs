namespace ArchLucid.Core.Identity;

public enum IdentityMigrationReviewReason
{
    DuplicateExternalIdentity = 0,
    EmailCollisionNoMerge = 1,
    LinkedEntraOidConflict = 2,
    MissingEntraTenantId = 3,
    MissingDefaultWorkspace = 4
}

public sealed class IdentityMigrationReviewItemRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public string LegacySourceType
    {
        get;
        init;
    } = string.Empty;

    public Guid LegacySourceId
    {
        get;
        init;
    }

    public Guid? TenantId
    {
        get;
        init;
    }

    public IdentityMigrationReviewReason ReasonCode
    {
        get;
        init;
    }

    public string ReasonDetail
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset DetectedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? ResolvedUtc
    {
        get;
        init;
    }
}

public sealed class IdentityMigrationReport
{
    public int PlatformUsersCreated
    {
        get;
        init;
    }

    public int AuthenticationIdentitiesCreated
    {
        get;
        init;
    }

    public int WorkspaceMembershipsCreated
    {
        get;
        init;
    }

    public int ReviewItemsCreated
    {
        get;
        init;
    }

    public IReadOnlyList<IdentityMigrationReviewItemRecord> ReviewItems
    {
        get;
        init;
    } = [];
}
