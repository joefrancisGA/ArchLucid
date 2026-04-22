using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation.ReferenceCases;

/// <summary>One reference bar for <see cref="AgentOutputReferenceCaseRunEvaluator" /> (loaded from JSON).</summary>
public sealed class AgentOutputReferenceCaseDefinition
{
    public string CaseId
    {
        get;
        set;
    } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AgentType AgentType
    {
        get;
        set;
    }

    /// <summary>Minimum <see cref="AgentOutputEvaluationScore.StructuralCompletenessRatio" />; zero skips.</summary>
    public double MinimumStructuralCompleteness
    {
        get;
        set;
    }

    /// <summary>Minimum semantic score; zero skips.</summary>
    public double MinimumSemanticScore
    {
        get;
        set;
    }

    public int MinimumFindingCount
    {
        get;
        set;
    }

    public IReadOnlyList<string> ExpectedFindingCategories
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> RequiredJsonKeys
    {
        get;
        set;
    } = [];
}
