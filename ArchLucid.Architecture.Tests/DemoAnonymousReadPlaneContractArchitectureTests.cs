using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-1251: Demo/anonymous read plane contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DemoAnonymousReadPlaneContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb1251_demo_anonymous_read_plane_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-1251");
        text.Should().Contain("DemoScopes");
        text.Should().Contain("AllowAnonymous");
        text.Should().Contain("ProductionSafetyRules");
        text.Should().Contain("TB-1252");
    }

    [Fact]
    public void Tb1251_gtm_m218_section_and_alias_exist()
    {
        string packetPath = Path.Combine(RepoRoot, "docs", "go-to-market", "BUYER_SECURITY_PROCUREMENT_PACKET.md");
        string aliasPath = Path.Combine(RepoRoot, "docs", "go-to-market", "DEMO_ANONYMOUS_READ_PLANE_PA_ONE_PAGER.md");

        File.Exists(packetPath).Should().BeTrue();
        File.Exists(aliasPath).Should().BeTrue();

        string packet = File.ReadAllText(packetPath);
        packet.Should().Contain("demo-anonymous-read-plane-m-218");
        packet.Should().Contain("TB-1251");

        File.ReadAllText(aliasPath).Should().Contain("M-218");
    }

    [Fact]
    public void Tb1251_demo_and_showcase_anchors_exist()
    {
        string demoScopes = Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Demo", "DemoScopes.cs");
        string demoExplain = Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Demo", "DemoExplainController.cs");
        string showcaseStatic = Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "showcase-static-demo.ts");

        File.Exists(demoScopes).Should().BeTrue();
        File.Exists(demoExplain).Should().BeTrue();
        File.Exists(showcaseStatic).Should().BeTrue();

        File.ReadAllText(demoScopes).Should().Contain("BuildDemoScope");
        File.ReadAllText(demoExplain).Should().Contain("AllowAnonymous");
        File.ReadAllText(showcaseStatic).Should().Contain("CANONICAL_ANONYMOUS_PROOF_HREF");
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
