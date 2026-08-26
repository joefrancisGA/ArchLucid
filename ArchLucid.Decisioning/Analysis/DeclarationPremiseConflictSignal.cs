using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Pure classification output for one declaration-versus-intent premise conflict.</summary>
public sealed class DeclarationPremiseConflictSignal
{
    public string ConflictKind
    {
        get;
        init;
    } = null!;

    public string DeclarationPropertyKey
    {
        get;
        init;
    } = null!;

    public string DeclarationPropertyValue
    {
        get;
        init;
    } = null!;

    public string IntentNodeId
    {
        get;
        init;
    } = null!;

    public string IntentRequirementText
    {
        get;
        init;
    } = null!;

    /// <summary>True when linked by a weighted PROTECTS / APPLIES_TO edge; false for graph-wide fallback.</summary>
    public bool IsNarrowApplicability
    {
        get;
        init;
    }
}

/// <summary>Intent node resolved for a topology resource, with narrow-edge confidence marker.</summary>
public readonly record struct ApplicableIntentNode(GraphNode IntentNode, bool IsNarrowApplicability);
