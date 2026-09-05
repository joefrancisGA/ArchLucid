using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationPatternMatchResultRecord
{
    public Guid MatchResultId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid FindingId
    {
        get;
        init;
    }

    public Guid PatternId
    {
        get;
        init;
    }

    public Guid VersionId
    {
        get;
        init;
    }

    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public string PatternVersion
    {
        get;
        init;
    } = string.Empty;

    public RemediationPatternMatchKind MatchKind
    {
        get;
        init;
    }

    public RemediationPatternMatchSource MatchSource
    {
        get;
        init;
    }

    public string ExplainText
    {
        get;
        init;
    } = string.Empty;

    public bool IsActive
    {
        get;
        init;
    }

    public DateTime MatchedUtc
    {
        get;
        init;
    }
}

public sealed class RemediationPatternMatchConflictRecord
{
    public Guid ConflictId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid FindingId
    {
        get;
        init;
    }

    public RemediationPatternMatchConflictType ConflictType
    {
        get;
        init;
    }

    public string Description
    {
        get;
        init;
    } = string.Empty;

    public string CandidatePatternIdsJson
    {
        get;
        init;
    } = "[]";

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}

public sealed class RemediationPatternApprovedVersionRecord
{
    public RemediationPatternRecord Pattern
    {
        get;
        init;
    } = null!;

    public RemediationPatternVersionRecord Version
    {
        get;
        init;
    } = null!;
}
