namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityAssetAssertionResponse
{
    public Guid AssertionId
    {
        get;
        init;
    }

    public Guid CloudResourceId
    {
        get;
        init;
    }

    public string DataSensitivity
    {
        get;
        init;
    } = string.Empty;

    public string RegulatoryClass
    {
        get;
        init;
    } = string.Empty;

    public string DeploymentEnvironment
    {
        get;
        init;
    } = string.Empty;

    public string BusinessCriticality
    {
        get;
        init;
    } = string.Empty;

    public bool IsRevenueImpact
    {
        get;
        init;
    }

    public bool IsPatientImpact
    {
        get;
        init;
    }

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

    public bool QualifiesAsCrownJewel
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

public sealed class SecurityAssetAssertionCreateApiRequest
{
    public Guid CloudResourceId
    {
        get;
        init;
    }

    public string DataSensitivity
    {
        get;
        init;
    } = string.Empty;

    public string RegulatoryClass
    {
        get;
        init;
    } = string.Empty;

    public string DeploymentEnvironment
    {
        get;
        init;
    } = string.Empty;

    public string BusinessCriticality
    {
        get;
        init;
    } = string.Empty;

    public bool IsRevenueImpact
    {
        get;
        init;
    }

    public bool IsPatientImpact
    {
        get;
        init;
    }

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

public sealed class SecurityAssetAssertionRenewApiRequest
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

public sealed class SecurityAssetAssertionCreateApiResponse
{
    public Guid AssertionId
    {
        get;
        init;
    }
}

public sealed class SecurityAssetAssertionRevokeApiRequest
{
    public string RevokedByActorKey
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityAssetAssertionExpirySweepApiResponse
{
    public int ExpiredCount
    {
        get;
        init;
    }

    public int ObservationsCreatedCount
    {
        get;
        init;
    }
}
