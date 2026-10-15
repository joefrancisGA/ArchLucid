using ArchLucid.Contracts.Serialization;

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

    private List<string> inlineRequirements = [];

    public List<string> InlineRequirements
    {
        get => inlineRequirements;
        set => inlineRequirements = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ContextDocumentReference> documents = [];

    public List<ContextDocumentReference> Documents
    {
        get => documents;
        set => documents = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> policyReferences = [];

    public List<string> PolicyReferences
    {
        get => policyReferences;
        set => policyReferences = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> topologyHints = [];

    public List<string> TopologyHints
    {
        get => topologyHints;
        set => topologyHints = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> securityBaselineHints = [];

    public List<string> SecurityBaselineHints
    {
        get => securityBaselineHints;
        set => securityBaselineHints = ContractCollectionDefaults.Coalesce(value);
    }

    private List<InfrastructureDeclarationReference> infrastructureDeclarations = [];

    public List<InfrastructureDeclarationReference> InfrastructureDeclarations
    {
        get => infrastructureDeclarations;
        set => infrastructureDeclarations = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> requiredCapabilities = [];

    public List<string> RequiredCapabilities
    {
        get => requiredCapabilities;
        set => requiredCapabilities = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> constraints = [];

    public List<string> Constraints
    {
        get => constraints;
        set => constraints = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> assumptions = [];

    public List<string> Assumptions
    {
        get => assumptions;
        set => assumptions = ContractCollectionDefaults.Coalesce(value);
    }

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
