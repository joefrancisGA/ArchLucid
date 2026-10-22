namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityDeclaredConnectionResponse
{
    public Guid ConnectionId
    {
        get;
        init;
    }

    public Guid FromCloudResourceId
    {
        get;
        init;
    }

    public Guid ToCloudResourceId
    {
        get;
        init;
    }

    public string RelationshipType
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? EvidenceReference
    {
        get;
        init;
    }

    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = string.Empty;

    public string ProvenanceKind
    {
        get;
        init;
    } = "HumanAssertion";

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

public sealed class SecurityDeclaredConnectionCreateApiRequest
{
    public Guid FromCloudResourceId
    {
        get;
        init;
    }

    public Guid ToCloudResourceId
    {
        get;
        init;
    }

    public string RelationshipType
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? EvidenceReference
    {
        get;
        init;
    }

    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public string RequestedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public string ApprovedByActorKey
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityDeclaredConnectionRenewApiRequest
{
    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public string RenewedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public string ApprovedByActorKey
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityDeclaredConnectionCreateApiResponse
{
    public Guid ConnectionId
    {
        get;
        init;
    }
}

public sealed class SecurityDeclaredConnectionRevokeApiRequest
{
    public string RevokedByActorKey
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityDeclaredConnectionExpirySweepApiResponse
{
    public int ExpiredCount
    {
        get;
        init;
    }
}
