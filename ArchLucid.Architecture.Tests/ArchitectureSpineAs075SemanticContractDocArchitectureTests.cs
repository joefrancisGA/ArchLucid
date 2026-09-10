using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-075 ratchet: PA-facing semantic support band contract doc exists and ADR 0085 links to it.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs075SemanticContractDocArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string ContractRelativePath = "docs/library/FINDING_SEMANTIC_SUPPORT_BAND_CONTRACT.md";

    private const string AdrRelativePath =
        "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md";

    [Fact]
    public void As075_contract_file_exists_for_pa_what_does_supported_mean()
    {
        string path = Path.Combine(RepoRoot, ContractRelativePath);
        File.Exists(path).Should().BeTrue($"AS-075 contract must exist at {ContractRelativePath}");
    }

    [Fact]
    public void As075_contract_summarizes_enum_scorer_warn_hold_simulator_and_density()
    {
        string contract = File.ReadAllText(Path.Combine(RepoRoot, ContractRelativePath));

        contract.Should().Contain("Supported");
        contract.Should().Contain("Unchecked");
        contract.Should().Contain("Unsupported");
        contract.Should().Contain("NotScored");
        contract.Should().Contain("as057-v1");
        contract.Should().Contain("TB-1228");
        contract.Should().Contain("AS-066");
        contract.Should().Contain("AS-074");
        contract.Should().Contain("warn");
        contract.Should().Contain("PilotStrict");
        contract.Should().Contain("Simulator");
        contract.Should().Contain("insight-density");
        contract.Should().Contain("non-fusion");
        contract.Should().Contain("Honesty examples");
        contract.Should().Contain("Forbidden claims");
    }

    [Fact]
    public void As075_adr_0085_links_to_contract_doc()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("FINDING_SEMANTIC_SUPPORT_BAND_CONTRACT.md");
        adr.Should().Contain("AS-075");
    }

    [Fact]
    public void As075_contract_links_tb1228_lane_contract_and_adr_0085()
    {
        string contract = File.ReadAllText(Path.Combine(RepoRoot, ContractRelativePath));

        contract.Should().Contain("FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md");
        contract.Should().Contain("0085-semantic-support-band-working-career-not-commit-gate.md");
        contract.Should().Contain("ArchitectureSpineAs075SemanticContractDocArchitectureTests");
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
