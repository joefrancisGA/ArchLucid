using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>Loads the golden planted-defect recall baseline committed for CI drift tracking (TB-2342 item 55).</summary>
internal static class ArchitectureIntelligenceGoldenRecallBaseline
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static GoldenPlantedDefectRecallBaselineDocument Load()
    {
        string path = Path.Combine(
            AppContext.BaseDirectory,
            "ArchitectureIntelligence",
            "Fixtures",
            "GoldenPlantedDefectRecallBaseline.v1.json");

        if (!File.Exists(path))
        {
            throw new FileNotFoundException(
                "Golden planted-defect recall baseline fixture is missing from test output.",
                path);
        }

        string json = File.ReadAllText(path);
        GoldenPlantedDefectRecallBaselineDocument? document =
            JsonSerializer.Deserialize<GoldenPlantedDefectRecallBaselineDocument>(json, SerializerOptions);

        if (document is null)
        {
            throw new InvalidOperationException("Golden planted-defect recall baseline JSON could not be parsed.");
        }

        return document;
    }

    internal sealed class GoldenPlantedDefectRecallBaselineDocument
    {
        [JsonPropertyName("fixtureId")]
        public string FixtureId { get; set; } = string.Empty;

        [JsonPropertyName("minimumPlantedDefectRecall")]
        public double MinimumPlantedDefectRecall { get; set; }

        [JsonPropertyName("matchingMethod")]
        public string MatchingMethod { get; set; } = string.Empty;
    }
}
