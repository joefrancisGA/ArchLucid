namespace ArchLucid.Contracts.Persistence.Context;

public class ContextIngestionRequest
{
    public Guid RunId
    {
        get;
        set;
    }

    /// <summary>Optional correlation to <c>ArchitectureRequests.RequestId</c> when the run originated from an API request.</summary>
    public string? ArchitectureRequestId
    {
        get;
        set;
    }

    public string ProjectId
    {
        get;
        set;
    } = null!;

    public string? Description
    {
        get;
        set;
    }

    public List<string> InlineRequirements
    {
        get;
        set;
    } = [];

    public List<ContextDocumentReference> Documents
    {
        get;
        set;
    } = [];

    public List<string> PolicyReferences
    {
        get;
        set;
    } = [];

    public List<string> TopologyHints
    {
        get;
        set;
    } = [];

    public List<string> SecurityBaselineHints
    {
        get;
        set;
    } = [];

    public List<InfrastructureDeclarationReference> InfrastructureDeclarations
    {
        get;
        set;
    } = [];

    public List<string> RequiredCapabilities
    {
        get;
        set;
    } = [];

    public List<string> Constraints
    {
        get;
        set;
    } = [];

    public List<string> Assumptions
    {
        get;
        set;
    } = [];

    /// <summary>JSON array of <see cref="Architecture.ActorDescriptor" /> for graph actor materialization.</summary>
    public string? ActorsJson
    {
        get;
        set;
    }

    public string? QualityAttribute
    {
        get;
        set;
    }

    public string? FailureModeNote
    {
        get;
        set;
    }

    /// <summary>Resolved review-model alias for engine provenance before authority pipeline finalizes (TB-310).</summary>
    public string? EffectiveModelAliasId
    {
        get;
        set;
    }
}
