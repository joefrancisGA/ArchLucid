using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityCrosswalkMappingRecord
{
    public Guid MappingId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public SecurityCrosswalkEndpointKind SourceEndpointKind
    {
        get;
        init;
    }

    public string SourceEndpointId
    {
        get;
        init;
    } = string.Empty;

    public SecurityCrosswalkEndpointKind TargetEndpointKind
    {
        get;
        init;
    }

    public string TargetEndpointId
    {
        get;
        init;
    } = string.Empty;

    public SecurityCrosswalkMappingType MappingType
    {
        get;
        init;
    }

    public decimal Confidence
    {
        get;
        init;
    }

    public SecurityCrosswalkMappingSource MappingSource
    {
        get;
        init;
    }

    public string Version
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public bool HumanVerified
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

public sealed class SecurityCrosswalkMappingWriteRequest
{
    public SecurityCrosswalkEndpointKind SourceEndpointKind
    {
        get;
        init;
    }

    public string SourceEndpointId
    {
        get;
        init;
    } = string.Empty;

    public SecurityCrosswalkEndpointKind TargetEndpointKind
    {
        get;
        init;
    }

    public string TargetEndpointId
    {
        get;
        init;
    } = string.Empty;

    public SecurityCrosswalkMappingType MappingType
    {
        get;
        init;
    }

    public decimal Confidence
    {
        get;
        init;
    } = 1.0m;

    public SecurityCrosswalkMappingSource MappingSource
    {
        get;
        init;
    }

    public string Version
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public bool HumanVerified
    {
        get;
        init;
    }
}

public sealed class SecurityCrosswalkUpsertResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public IReadOnlyList<SecurityCrosswalkMappingRecord> Mappings
    {
        get;
        init;
    } = [];
}

public sealed class SecurityCrosswalkResolveResult
{
    public IReadOnlyList<SecurityCrosswalkMappingRecord> EvaluationEligibleMappings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> RejectionReasons
    {
        get;
        init;
    } = [];
}
