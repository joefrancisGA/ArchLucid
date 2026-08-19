using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-1232: tenant DiD erosion beyond predicates contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantDidErosionBeyondPredicatesContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb1232_tenant_did_erosion_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-1232");
        text.Should().Contain("erosion");
        text.Should().Contain("ARCH006");
        text.Should().Contain("TB-1233");
        text.Should().Contain("BuildRequiredScopeFilter");
    }

    [Fact]
    public void Tb1232_gtm_m214_section_and_alias_exist()
    {
        string packetPath = Path.Combine(RepoRoot, "docs", "go-to-market", "BUYER_SECURITY_PROCUREMENT_PACKET.md");
        string aliasPath = Path.Combine(RepoRoot, "docs", "go-to-market", "TENANT_DID_EROSION_BEYOND_PREDICATES_PA_ONE_PAGER.md");

        File.Exists(packetPath).Should().BeTrue();
        File.Exists(aliasPath).Should().BeTrue();

        string packet = File.ReadAllText(packetPath);
        packet.Should().Contain("tenant-did-erosion-beyond-predicates-m-214");
        packet.Should().Contain("TB-1232");

        File.ReadAllText(aliasPath).Should().Contain("M-214");
    }

    [Fact]
    public void Tb1232_isolation_spine_and_code_anchors_exist()
    {
        string didPath = Path.Combine(RepoRoot, "docs", "security", "TENANT_ISOLATION_DEFENSE_IN_DEPTH.md");
        string adrPath = Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0037-tenant-isolation-without-rls-defense-in-depth.md");
        string searchFilterPath = Path.Combine(RepoRoot, "ArchLucid.Retrieval", "Indexing", "AzureSearchTenantScopeFilterBuilder.cs");

        File.Exists(didPath).Should().BeTrue();
        File.Exists(adrPath).Should().BeTrue();
        File.Exists(searchFilterPath).Should().BeTrue();

        File.ReadAllText(didPath).Should().Contain("ARCH006");
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
