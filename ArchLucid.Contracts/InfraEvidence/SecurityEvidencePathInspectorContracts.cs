namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityEvidencePathSummaryResponse
{
    public Guid PathId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string PathKind
    {
        get;
        init;
    } = string.Empty;

    public string PathConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public int WeakestHopOrdinal
    {
        get;
        init;
    }

    public string WeakestHopReason
    {
        get;
        init;
    } = string.Empty;

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

public sealed class SecurityEvidencePathDetailResponse
{
    public Guid PathId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string PathKind
    {
        get;
        init;
    } = string.Empty;

    public string PathConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public int WeakestHopOrdinal
    {
        get;
        init;
    }

    public string WeakestHopReason
    {
        get;
        init;
    } = string.Empty;

    public Guid? CrownJewelAssertionId
    {
        get;
        init;
    }

    public IReadOnlyList<SecurityEvidencePathHopResponse> Hops
    {
        get;
        init;
    } = [];

    public IReadOnlyList<Guid> CitingFindingIds
    {
        get;
        init;
    } = [];

    public SecurityEvidencePathWeakestHopResponse? WeakestHop
    {
        get;
        init;
    }

    public SecurityEvidencePathExplanationTemplateResponse ExplanationTemplate
    {
        get;
        init;
    } = new();

    public IReadOnlyList<SecurityEvidenceCutPointSummaryResponse> RelatedCutPoints
    {
        get;
        init;
    } = [];

    public IReadOnlyList<SecurityEvidencePathRoutingResponse> Routing
    {
        get;
        init;
    } = [];
}

public sealed class SecurityEvidencePathRoutingResponse
{
    public string Role
    {
        get;
        init;
    } = string.Empty;

    public string? PrincipalId
    {
        get;
        init;
    }

    public string? DisplayName
    {
        get;
        init;
    }

    public string ProvenanceKind
    {
        get;
        init;
    } = string.Empty;

    public string SourceReference
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityEvidencePathHopResponse
{
    public int HopOrdinal
    {
        get;
        init;
    }

    public string FromNodeLabel
    {
        get;
        init;
    } = string.Empty;

    public string ToNodeLabel
    {
        get;
        init;
    } = string.Empty;

    public string EdgeType
    {
        get;
        init;
    } = string.Empty;

    public string ProvenanceKind
    {
        get;
        init;
    } = string.Empty;

    public string HopConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public string? InferenceSource
    {
        get;
        init;
    }

    public string EvidenceReference
    {
        get;
        init;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        init;
    }
}

public sealed class SecurityEvidencePathWeakestHopResponse
{
    public int HopOrdinal
    {
        get;
        init;
    }

    public string EdgeType
    {
        get;
        init;
    } = string.Empty;

    public string HopConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public string ProvenanceKind
    {
        get;
        init;
    } = string.Empty;

    public string Reason
    {
        get;
        init;
    } = string.Empty;
}

/// <summary>
///     Lecture template slots for SecureNow architect explanations (SA-04).
///     Values use short labels — not raw ARM JSON blobs.
/// </summary>
public sealed class SecurityEvidencePathExplanationTemplateResponse
{
    public string? Actor
    {
        get;
        init;
    }

    public string? Identity
    {
        get;
        init;
    }

    public string? Network
    {
        get;
        init;
    }

    public string? Asset
    {
        get;
        init;
    }

    public string? WeakControl
    {
        get;
        init;
    }

    public string? Verify
    {
        get;
        init;
    }
}
