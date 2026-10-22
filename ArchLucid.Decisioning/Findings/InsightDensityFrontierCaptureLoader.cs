using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Loads committed frontier capture fixtures from JSON (DX-20).</summary>
public static class InsightDensityFrontierCaptureLoader
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
        Converters =
        {
            new JsonStringEnumConverter(),
            new FrontierBaselineSourceJsonConverter(),
        },
    };

    public static InsightDensityFrontierCaptureFixture LoadFromFile(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        string json = File.ReadAllText(path);

        return LoadFromJson(json);
    }

    public static InsightDensityFrontierCaptureFixture LoadFromJson(string json)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);

        InsightDensityFrontierCaptureFixture? fixture = JsonSerializer.Deserialize<InsightDensityFrontierCaptureFixture>(
            json,
            SerializerOptions);

        if (fixture is null)
        {
            throw new InvalidOperationException("Frontier capture fixture JSON did not deserialize.");
        }

        if (!string.Equals(fixture.Schema, InsightDensityFrontierCaptureFixture.SchemaId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Unexpected frontier capture schema '{fixture.Schema}'. Expected '{InsightDensityFrontierCaptureFixture.SchemaId}'.");
        }

        ValidateFixture(fixture);

        return fixture;
    }

    private static void ValidateFixture(InsightDensityFrontierCaptureFixture fixture)
    {
        if (string.Equals(fixture.Label, "synthetic", StringComparison.OrdinalIgnoreCase)
            && !fixture.ExpectedNoveltyPercentage.HasValue)
        {
            throw new InvalidOperationException(
                "Synthetic frontier capture fixtures must include expectedNoveltyPercentage.");
        }

        if (fixture.FrontierBaseline.Source == FrontierBaselineSource.Empty
            && fixture.FrontierBaseline.Findings.Count > 0)
        {
            throw new InvalidOperationException(
                "frontierBaseline.source=empty requires an empty findings array.");
        }
    }

    public static FindingsSnapshot BuildFindingsSnapshot(InsightDensityFrontierCaptureFixture fixture)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        List<Finding> findings = [];

        foreach (InsightDensityFrontierCaptureFixtureFinding row in fixture.ArchlucidFindings)
        {
            findings.Add(new Finding
            {
                FindingId = row.FindingId,
                EngineType = row.EngineType,
                Category = row.Category,
                Title = row.Title,
                PolicyRuleId = row.PolicyRuleId,
                Classification = ParseClassification(row.Classification),
                FindingType = "frontier-capture-fixture",
                Severity = FindingSeverity.Warning,
                Rationale = "Frontier capture fixture row.",
            });
        }

        return new FindingsSnapshot
        {
            FindingsSnapshotId = fixture.FindingsSnapshotId,
            Findings = findings,
        };
    }

    public static List<FrontierBaselineFinding> BuildBaseline(InsightDensityFrontierCaptureFixture fixture)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        List<FrontierBaselineFinding> baseline = [];

        foreach (InsightDensityFrontierCaptureBaselineFinding row in fixture.FrontierBaseline.Findings)
        {
            baseline.Add(new FrontierBaselineFinding
            {
                Category = row.Category,
                Title = row.Title,
                RuleId = row.RuleId,
            });
        }

        return baseline;
    }

    private static FindingClassification ParseClassification(string classification)
    {
        if (string.Equals(classification, nameof(FindingClassification.ChecklistCoverage), StringComparison.OrdinalIgnoreCase))
        {
            return FindingClassification.ChecklistCoverage;
        }

        return FindingClassification.DecisionGradeFinding;
    }
}
