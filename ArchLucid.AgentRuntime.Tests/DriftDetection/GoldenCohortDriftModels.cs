using System.Text.Json.Serialization;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

public sealed class GoldenCohortDriftFindingSummary
{
    [JsonPropertyName("findingCount")]
    public int FindingCount
    {
        get;
        set;
    }

    [JsonPropertyName("severityCounts")]
    public Dictionary<string, int> SeverityCounts
    {
        get;
        set;
    } = new(StringComparer.Ordinal);

    [JsonPropertyName("normalizedTitles")]
    public List<string> NormalizedTitles
    {
        get;
        set;
    } = [];

    [JsonPropertyName("normalizedRecommendations")]
    public List<string> NormalizedRecommendations
    {
        get;
        set;
    } = [];
}

/// <summary>Simulator-vs-real structured drift snapshot for one cohort scenario.</summary>
public sealed class GoldenCohortSimulatorVsRealDriftReport
{
    [JsonPropertyName("scenarioName")]
    public string ScenarioName
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("scenarioTitle")]
    public string ScenarioTitle
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("timestampUtc")]
    public DateTimeOffset TimestampUtc
    {
        get;
        set;
    }

    [JsonPropertyName("simulatorFindings")]
    public GoldenCohortDriftFindingSummary SimulatorFindings
    {
        get;
        set;
    } = new();

    [JsonPropertyName("realFindings")]
    public GoldenCohortDriftFindingSummary RealFindings
    {
        get;
        set;
    } = new();

    [JsonPropertyName("countDelta")]
    public int CountDelta
    {
        get;
        set;
    }

    [JsonPropertyName("severityDivergence")]
    public double SeverityDivergence
    {
        get;
        set;
    }

    [JsonPropertyName("titleOverlap")]
    public double TitleOverlap
    {
        get;
        set;
    }

    [JsonPropertyName("recommendationOverlap")]
    public double RecommendationOverlap
    {
        get;
        set;
    }

    [JsonPropertyName("realModeInputTokens")]
    public int RealModeInputTokens
    {
        get;
        set;
    }

    [JsonPropertyName("realModeOutputTokens")]
    public int RealModeOutputTokens
    {
        get;
        set;
    }

    [JsonPropertyName("realExecutionError")]
    public string? RealExecutionError
    {
        get;
        set;
    }
}

internal sealed class GoldenCohortDriftTrendEvent
{
    [JsonPropertyName("scenarioId")]
    public string ScenarioId
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("timestampUtc")]
    public DateTimeOffset TimestampUtc
    {
        get;
        set;
    }

    [JsonPropertyName("severityDivergence")]
    public double SeverityDivergence
    {
        get;
        set;
    }

    [JsonPropertyName("titleOverlap")]
    public double TitleOverlap
    {
        get;
        set;
    }

    [JsonPropertyName("recommendationOverlap")]
    public double RecommendationOverlap
    {
        get;
        set;
    }

    [JsonPropertyName("countDelta")]
    public int CountDelta
    {
        get;
        set;
    }
}
