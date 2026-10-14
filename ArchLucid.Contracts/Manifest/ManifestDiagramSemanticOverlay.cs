using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Actor, trust, requirement, and decision nodes for manifest Mermaid enrichment (TB-2351).
/// </summary>
public sealed class ManifestDiagramSemanticOverlay
{
    private List<ActorDescriptor> actors = [];

    public List<ActorDescriptor> Actors
    {
        get => actors;
        set => actors = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> trustBoundaryLabels = [];

    public List<string> TrustBoundaryLabels
    {
        get => trustBoundaryLabels;
        set => trustBoundaryLabels = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> requirementLabels = [];

    public List<string> RequirementLabels
    {
        get => requirementLabels;
        set => requirementLabels = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> decisionLabels = [];

    public List<string> DecisionLabels
    {
        get => decisionLabels;
        set => decisionLabels = ContractCollectionDefaults.Coalesce(value);
    }
}
