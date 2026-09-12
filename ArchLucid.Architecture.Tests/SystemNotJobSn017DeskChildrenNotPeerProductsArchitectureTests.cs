using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-017 ratchet: architecture desk lists child reviews/drafts and Working Compare nests under the architecture (ADR 0079).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn017DeskChildrenNotPeerProductsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn017_module_names_nested_compare_resolver_and_child_surfaces()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-desk-children-not-peer-products.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingDeskCompareHref");
        module.Should().Contain("SYSTEM_NOT_JOB_DESK_CHILD_LIST_SURFACES");
        module.Should().Contain("SN-017");
        module.Should().Contain("0079");
    }

    [Fact]
    public void Sn017_desk_compare_action_uses_nested_resolver()
    {
        string compareAction = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureIdentityDeskCompareAction.tsx"));

        compareAction.Should().Contain("resolveArchitectureDeskCompareHref");
        compareAction.Should().Contain("workingMode");
    }

    [Fact]
    public void Sn017_vitest_ratchet_names_nested_compare_and_guided_peer_fallback()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-desk-children-not-peer-products.test.ts"));

        test.Should().Contain("SN-017");
        test.Should().Contain("nests Working desk Compare");
        test.Should().Contain("keeps Guided desk Compare on peer Insights");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
