using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Actor, trust, requirement, and decision nodes for manifest Mermaid enrichment (TB-2351).
/// </summary>
public sealed class ManifestDiagramSemanticOverlay
{
    public List<ActorDescriptor> Actors
    {
        get;
        set;
    } = [];

    public List<string> TrustBoundaryLabels
    {
        get;
        set;
    } = [];

    public List<string> RequirementLabels
    {
        get;
        set;
    } = [];

    public List<string> DecisionLabels
    {
        get;
        set;
    } = [];
}
