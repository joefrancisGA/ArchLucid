namespace ArchLucid.Persistence.Findings;

internal sealed class FindingRecordRow
{
    public Guid FindingRecordId
    {
        get;
        init;
    }

    public int SortOrder
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = null!;

    public int FindingSchemaVersion
    {
        get;
        init;
    }

    public string FindingType
    {
        get;
        init;
    } = null!;

    public string Category
    {
        get;
        init;
    } = null!;

    public string? QualityDimension
    {
        get;
        init;
    }

    public string EngineType
    {
        get;
        init;
    } = null!;

    public string Severity
    {
        get;
        init;
    } = null!;

    public string Title
    {
        get;
        init;
    } = null!;

    public string Rationale
    {
        get;
        init;
    } = null!;

    public string? PayloadType
    {
        get;
        init;
    }

    public string? PayloadJson
    {
        get;
        init;
    }

    public string? RequestInputRef
    {
        get;
        init;
    }

    public string? RunIdRef
    {
        get;
        init;
    }

    public string? AgentExecutionTraceId
    {
        get;
        init;
    }

    public string? ModelDeploymentName
    {
        get;
        init;
    }

    public string? ModelVersion
    {
        get;
        init;
    }

    public string? PromptTemplateId
    {
        get;
        init;
    }

    public string? PromptTemplateVersion
    {
        get;
        init;
    }

    public double? ConfidenceScore
    {
        get;
        init;
    }

    public int? EvaluationConfidenceScore
    {
        get;
        init;
    }

    public string? EvaluationConfidenceLevel
    {
        get;
        init;
    }

    public string? PolicyRuleId
    {
        get;
        init;
    }

    public string? HumanReviewStatus
    {
        get;
        init;
    }

    public string? ReviewedByUserId
    {
        get;
        init;
    }

    public DateTime? ReviewedAtUtc
    {
        get;
        init;
    }

    public string? ReviewNotes
    {
        get;
        init;
    }

    public bool IsMuted
    {
        get;
        init;
    }

    public string? MuteReason
    {
        get;
        init;
    }

    public string? ReasoningTrace
    {
        get;
        init;
    }

    public string? ReasoningTraceDigestSha256
    {
        get;
        init;
    }

    public int? InsightDensityScore
    {
        get;
        init;
    }

    public byte? Treatment
    {
        get;
        init;
    }

    public byte? Classification
    {
        get;
        init;
    }

    public string? WhyThisIsNotGeneric
    {
        get;
        init;
    }

    public string? PrincipalArchitectValue
    {
        get;
        init;
    }

    public string? DecisionConsequence
    {
        get;
        init;
    }
}

#pragma warning disable CA1812 // instantiated via Dapper
internal sealed class FindingChildSliceRow
#pragma warning restore CA1812
{
    public string SliceKind
    {
        get;
        init;
    } = null!;

    public Guid FindingRecordId
    {
        get;
        init;
    }

    public int SortOrder
    {
        get;
        init;
    }

    public string? Item
    {
        get;
        init;
    }

    public string? PropertyKey
    {
        get;
        init;
    }

    public string? PropertyValue
    {
        get;
        init;
    }
}
