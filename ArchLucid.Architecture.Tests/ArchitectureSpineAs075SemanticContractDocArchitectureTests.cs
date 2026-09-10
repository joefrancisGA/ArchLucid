using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-075 ratchet: semantic support band contract doc exists and ADR 0085 links it.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs075SemanticContractDocArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string ContractRelativePath = "docs/library/FINDING_SEMANTIC_SUPPORT_BAND_CONTRACT.md";

    private const string AdrRelativePath =
        "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md";

    [Fact]
    public void As075_contract_doc_exists_and_names_enum_values()
    {
        string contract = File.ReadAllText(Path.Combine(RepoRoot, ContractRelativePath));

        contract.Should().Contain("Supported");
        contract.Should().Contain("Unchecked");
        contract.Should().Contain("Unsupported");
        contract.Should().Contain("NotScored");
        contract.Should().Contain("TB-1228");
        contract.Should().Contain("AS-066");
        contract.Should().Contain("AS-074");
    }

    [Fact]
    public void As075_adr_0085_links_contract_doc()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("FINDING_SEMANTIC_SUPPORT_BAND_CONTRACT.md");
        adr.Should().Contain("AS-075");
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
