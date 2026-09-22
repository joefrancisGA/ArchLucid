using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-090: architecture share ACL contract and evaluator ratchet.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs090ShareRoleMatrixArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string ContractRelativePath = "docs/library/ARCHITECTURE_SHARE_ACL_CONTRACT.md";

    [Fact]
    public void As090_contract_documents_view_decide_admin_intersection()
    {
        string path = Path.Combine(RepoRoot, ContractRelativePath);
        File.Exists(path).Should().BeTrue();

        string contract = File.ReadAllText(path);

        contract.Should().Contain("Architecture share ACL contract");
        contract.Should().Contain("View");
        contract.Should().Contain("Decide");
        contract.Should().Contain("Admin");
        contract.Should().Contain("ExecuteAuthority");
        contract.Should().Contain("ReadAuthority");
        contract.Should().Contain("Decide share without ExecuteAuthority cannot dispose");
        contract.Should().Contain("ExecuteAuthority without share cannot dispose");
        contract.Should().Contain("ArchitectureShareAccessEvaluator");
        contract.Should().Contain("ADR 0087");
        contract.Should().NotContain("ROW LEVEL SECURITY", "ADR 0037 tenant catalog — no SQL RLS (AS-090)");
    }

    [Fact]
    public void As090_evaluator_source_exists_in_application_architecture()
    {
        string evaluatorPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Architecture",
            "ArchitectureShareAccessEvaluator.cs");

        File.Exists(evaluatorPath).Should().BeTrue();

        string source = File.ReadAllText(evaluatorPath);

        source.Should().Contain("ArchitectureShareAccessEvaluator");
        source.Should().Contain("hasExecuteAuthority");
        source.Should().Contain("ArchitectureShareRoles.Decide");
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
