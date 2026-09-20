namespace ArchLucid.Contracts.InfraEvidence;

public sealed class OperatorInferredConnectionResponse
{
    public Guid ConnectionId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = string.Empty;

    public string Source
    {
        get;
        init;
    } = string.Empty;

    public string? RuleName
    {
        get;
        init;
    }

    public string? QuestionText
    {
        get;
        init;
    }

    public string? FromArmId
    {
        get;
        init;
    }

    public string? FromLabel
    {
        get;
        init;
    }

    public Guid? FromCloudResourceId
    {
        get;
        init;
    }

    public string? ToHost
    {
        get;
        init;
    }

    public string? ToCatalog
    {
        get;
        init;
    }

    public string? ToArmId
    {
        get;
        init;
    }

    public Guid? ToCloudResourceId
    {
        get;
        init;
    }

    public string? SettingName
    {
        get;
        init;
    }

    public string? SourceFileFormat
    {
        get;
        init;
    }

    public string ProvenanceKind
    {
        get;
        init;
    } = "DeterministicInference";

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

public sealed class OperatorInferredConnectionConfirmApiRequest
{
    public Guid ConnectionId
    {
        get;
        init;
    }

    public Guid? FromCloudResourceId
    {
        get;
        init;
    }

    public Guid? ToCloudResourceId
    {
        get;
        init;
    }

    public string? ToArmId
    {
        get;
        init;
    }

    public string? ToCatalog
    {
        get;
        init;
    }
}

public sealed class OperatorInferredConnectionDismissApiRequest
{
    public Guid ConnectionId
    {
        get;
        init;
    }
}

public sealed class InferenceQuestionnaireListResponse
{
    public IReadOnlyList<OperatorInferredConnectionResponse> Items
    {
        get;
        init;
    } = [];

    public int TotalCount
    {
        get;
        init;
    }

    public int Cap
    {
        get;
        init;
    }

    public bool CapReached
    {
        get;
        init;
    }
}
