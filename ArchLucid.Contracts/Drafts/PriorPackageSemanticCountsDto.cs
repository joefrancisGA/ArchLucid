using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>
///     Counts of semantic objects that would carry forward from a prior committed package (TB-2350).
/// </summary>
public sealed class PriorPackageSemanticCountsDto
{
    [JsonPropertyName("actorCount")]
    public int ActorCount
    {
        get;
        set;
    }

    [JsonPropertyName("assumptionCount")]
    public int AssumptionCount
    {
        get;
        set;
    }

    [JsonPropertyName("decisionCount")]
    public int DecisionCount
    {
        get;
        set;
    }

    [JsonPropertyName("requirementCount")]
    public int RequirementCount
    {
        get;
        set;
    }
}
