using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-320–TB-328: correctness guardrail artifacts stay wired in repo and CI.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CorrectnessGuardrailsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb320_run_detail_kpi_semantic_contract_exists()
    {
        string json = Path.Combine(RepoRoot, "docs", "library", "RUN_DETAIL_KPI_SEMANTIC_CONTRACT.json");
        string ts = Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-detail-kpi-semantic-contract.ts");

        File.Exists(json).Should().BeTrue();
        File.Exists(ts).Should().BeTrue();
    }

    [Fact]
    public void Tb322_finalized_evidence_immutability_tests_exist()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "Security",
            "FinalizedEvidenceImmutabilityIntegrationTests.cs");

        File.Exists(path).Should().BeTrue();
        File.ReadAllText(path).Should().Contain("TB-322");
    }

    [Fact]
    public void Tb323_idempotency_contract_tests_exist()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "MutatingEndpointIdempotencyContractIntegrationTests.cs");

        File.Exists(path).Should().BeTrue();
    }

    [Fact]
    public void Tb324_citation_fidelity_options_exist()
    {
        string checker = Path.Combine(
            RepoRoot,
            "ArchLucid.AgentRuntime",
            "Evaluation",
            "AgentResultEvidenceFaithfulnessChecker.cs");

        string options = Path.Combine(RepoRoot, "ArchLucid.Core", "Configuration", "AgentFaithfulnessOptions.cs");

        File.ReadAllText(checker).Should().Contain("MeetsCitationFidelity");
        File.ReadAllText(options).Should().Contain("MinCitationFidelityDensityRatio");
    }

    [Fact]
    public void Tb328_correctness_guardrails_batch_test_exists()
    {
        string path = Path.Combine(RepoRoot, "scripts", "ci", "tests", "test_correctness_guardrails_batch_328.py");
        File.Exists(path).Should().BeTrue();
    }

    [Fact]
    public void Ci_workflow_runs_correctness_guardrails_batch_328()
    {
        string ciText = File.ReadAllText(Path.Combine(RepoRoot, ".github", "workflows", "ci.yml"));
        ciText.Should().Contain("test_correctness_guardrails_batch_328.py");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
