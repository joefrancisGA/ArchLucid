using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingVerificationDeterministicScorerGoldenFixtureTests
{
    private static readonly string FixturePath = Path.Combine(
        FindRepoRoot(),
        "tests",
        "fixtures",
        "finding-verification",
        "deterministic-scorer-golden.json");

    private readonly FindingVerificationDeterministicScorer _scorer = new();

    [Fact]
    public void Golden_fixture_scenarios_match_expected_statuses()
    {
        string json = File.ReadAllText(FixturePath);
        GoldenFixtureDocument? document = JsonSerializer.Deserialize<GoldenFixtureDocument>(json);

        document.Should().NotBeNull();
        document!.Scenarios.Should().NotBeEmpty();

        foreach (GoldenFixtureScenario scenario in document.Scenarios)
        {
            Finding finding = BuildFinding(scenario);
            FindingVerificationScoringContext context = BuildContext(scenario);

            (FindingVerificationStatus status, string trace) = _scorer.Score(finding, context);

            status.ToString().Should().Be(scenario.ExpectedStatus, scenario.Name);
            trace.Should().StartWith(scenario.ExpectedRulePrefix, scenario.Name);
        }
    }

    private static Finding BuildFinding(GoldenFixtureScenario scenario)
    {
        List<string> evidenceRefs =
        [
            "arm:/subscriptions/demo/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/demo",
        ];

        if (scenario.FindingEvidenceRefs is not null)
        {
            evidenceRefs = scenario.FindingEvidenceRefs.ToList();
        }

        return new Finding
        {
            FindingId = "finding-verification-golden",
            Title = "Public storage exposure",
            Category = "Storage",
            EngineType = "Topology",
            Severity = FindingSeverity.Critical,
            PolicyRuleId = "rule-storage-public",
            EvidenceRefs = evidenceRefs,
        };
    }

    private static FindingVerificationScoringContext BuildContext(GoldenFixtureScenario scenario)
    {
        Guid verificationSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        FindingsSnapshot verificationSnapshot = new()
        {
            FindingsSnapshotId = verificationSnapshotId,
        };

        if (scenario.VerificationEvidenceRefs is not null)
        {
            verificationSnapshot.Findings =
            [
                new Finding
                {
                    FindingId = "verification-finding",
                    EvidenceRefs = scenario.VerificationEvidenceRefs.ToList(),
                },
            ];
        }

        CrossReviewFindingCorrelationResult correlation = new();

        if (scenario.CorrelateMatch == true)
        {
            correlation.MatchedPairs =
            [
                new FindingCorrelationPair
                {
                    LeftFindingId = "finding-verification-golden",
                    RightFindingId = "verification-finding",
                    Method = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                },
            ];
        }

        Dictionary<string, FindingDisposition> dispositions = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(scenario.Disposition)
            && Enum.TryParse(scenario.Disposition, ignoreCase: true, out FindingDisposition disposition))
        {
            dispositions["finding-verification-golden"] = disposition;
        }

        bool includeSnapshot = scenario.Name != "not-verifiable-no-snapshot";

        return new FindingVerificationScoringContext
        {
            VerificationFindingsSnapshotId = includeSnapshot ? verificationSnapshotId : null,
            VerificationSnapshot = includeSnapshot ? verificationSnapshot : null,
            Correlation = correlation,
            Dispositions = dispositions,
        };
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root containing ArchLucid.sln.");
    }

    private sealed class GoldenFixtureDocument
    {
        [JsonPropertyName("scenarios")]
        public List<GoldenFixtureScenario> Scenarios
        {
            get;
            init;
        } = [];
    }

    private sealed class GoldenFixtureScenario
    {
        [JsonPropertyName("name")]
        public string Name
        {
            get;
            init;
        } = string.Empty;

        [JsonPropertyName("expectedStatus")]
        public string ExpectedStatus
        {
            get;
            init;
        } = string.Empty;

        [JsonPropertyName("expectedRulePrefix")]
        public string ExpectedRulePrefix
        {
            get;
            init;
        } = string.Empty;

        [JsonPropertyName("findingEvidenceRefs")]
        public IReadOnlyList<string>? FindingEvidenceRefs
        {
            get;
            init;
        }

        [JsonPropertyName("verificationEvidenceRefs")]
        public IReadOnlyList<string>? VerificationEvidenceRefs
        {
            get;
            init;
        }

        [JsonPropertyName("correlateMatch")]
        public bool? CorrelateMatch
        {
            get;
            init;
        }

        [JsonPropertyName("disposition")]
        public string? Disposition
        {
            get;
            init;
        }
    }
}
