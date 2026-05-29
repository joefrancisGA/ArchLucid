using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

/// <summary>
///     Validates buyer-scenario fixtures under <c>tests/eval-corpus/buyer-scenarios/</c> without live LLM calls.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BuyerScenarioManifestTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [Theory]
    [InlineData("buyer-roi-citation-safety")]
    public void BuyerScenario_HasExpectedStructureAndSponsorSafetyRules(string scenarioId)
    {
        string repoRoot = FindRepoRoot();
        string scenarioPath = Path.Combine(
            repoRoot,
            "tests",
            "eval-corpus",
            "buyer-scenarios",
            $"scenario-{scenarioId}.json");

        File.Exists(scenarioPath).Should().BeTrue(because: $"scenario file must exist at {scenarioPath}");

        string json = File.ReadAllText(scenarioPath);
        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("id").GetString().Should().Be(scenarioId);
        root.GetProperty("expectedFindings").GetArrayLength().Should().BeGreaterThan(0);

        string agentResultRelative = root.GetProperty("qualityEvidence").GetProperty("agentResultPath").GetString()
            ?? throw new InvalidOperationException("agentResultPath required");

        string agentResultPath = Path.Combine(
            repoRoot,
            "tests",
            "eval-corpus",
            "buyer-scenarios",
            agentResultRelative.Replace('/', Path.DirectorySeparatorChar));

        File.Exists(agentResultPath).Should().BeTrue(because: "agent result fixture must exist for offline validation");

        if (root.TryGetProperty("sponsorSafety", out JsonElement sponsorSafety)
            && sponsorSafety.TryGetProperty("projectedDollarClaimsAllowed", out JsonElement allowed))
        {
            allowed.GetBoolean().Should().BeFalse(because: "ROI safety scenario must block sponsor-safe dollar claims");
        }

        string agentJson = File.ReadAllText(agentResultPath);

        agentJson.Should().NotContain(
            "sponsor-safe projected",
            because: "fixture must not encode unsafe dollar claims");
    }

    [Fact]
    public void BuyerScenarioDirectory_ContainsAtLeastEightScenarioFiles()
    {
        string repoRoot = FindRepoRoot();
        string buyerDir = Path.Combine(repoRoot, "tests", "eval-corpus", "buyer-scenarios");
        string corpusDir = Path.Combine(repoRoot, "tests", "eval-corpus");

        int buyerCount = Directory.Exists(buyerDir)
            ? Directory.GetFiles(buyerDir, "scenario-*.json", SearchOption.TopDirectoryOnly).Length
            : 0;

        int corpusCount = Directory.GetFiles(corpusDir, "scenario-*.json", SearchOption.TopDirectoryOnly).Length;

        (buyerCount + corpusCount).Should().BeGreaterOrEqualTo(8, because: "assessment requires at least eight buyer-shaped scenarios across eval-corpus");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(Directory.GetCurrentDirectory());

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root (ArchLucid.sln).");
    }
}
