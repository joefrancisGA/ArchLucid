namespace ArchLucid.Persistence.Models;

/// <summary>
///     Parameter bundle for <c>dbo.sp_FinalizeManifest</c> invoked by
///     <see cref="Interfaces.IManifestFinalizationSqlRepository.ExecuteFinalizeProcedureAsync" />.
/// </summary>
public sealed class ManifestFinalizationProcedureRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ScopeProjectId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public Guid ExpectedFindingsSnapshotId
    {
        get;
        init;
    }

    public Guid? ExpectedArtifactBundleId
    {
        get;
        init;
    }

    public Guid ManifestId
    {
        get;
        init;
    }

    public Guid DecisionTraceId
    {
        get;
        init;
    }

    public string ManifestVersion
    {
        get;
        init;
    } = null!;

    public byte[] ExpectedRowVersion
    {
        get;
        init;
    } = null!;

    public string ActorUserId
    {
        get;
        init;
    } = null!;

    public string ActorUserName
    {
        get;
        init;
    } = null!;

    public Guid AuditEventId
    {
        get;
        init;
    }

    public DateTime OccurredUtc
    {
        get;
        init;
    }

    public string AuditDataJson
    {
        get;
        init;
    } = null!;

    public string? CorrelationId
    {
        get;
        init;
    }

    public Guid OutboxId
    {
        get;
        init;
    }

    public string IntegrationEventType
    {
        get;
        init;
    } = null!;

    public string OutboxMessageId
    {
        get;
        init;
    } = null!;

    public byte[] OutboxPayloadUtf8
    {
        get;
        init;
    } = null!;

    public int OutboxPriority
    {
        get;
        init;
    }
}
