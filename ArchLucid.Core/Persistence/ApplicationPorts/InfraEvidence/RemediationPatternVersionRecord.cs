using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationPatternVersionRecord
{
    public Guid VersionId
    {
        get;
        init;
    }

    public Guid PatternId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string Version
    {
        get;
        init;
    } = string.Empty;

    public RemediationPatternStatus Status
    {
        get;
        init;
    }

    public string ControlObjective
    {
        get;
        init;
    } = string.Empty;

    public string ContentJson
    {
        get;
        init;
    } = string.Empty;

    public CloudProvider? MatchProvider
    {
        get;
        init;
    }

    public string? MatchResourceType
    {
        get;
        init;
    }

    public string? MatchControlId
    {
        get;
        init;
    }

    public string? MatchSeverityMin
    {
        get;
        init;
    }

    public string? MatchPropertyEqualsJson
    {
        get;
        init;
    }

    public RemediationAutomationLevel AutomationLevel
    {
        get;
        init;
    }

    public string AuthorActorKey
    {
        get;
        init;
    } = string.Empty;

    public string? ApprovedByActorKey
    {
        get;
        init;
    }

    public DateTime? ApprovedUtc
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
