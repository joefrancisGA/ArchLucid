using System.Text.Json;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-321: route / tier / policy / nav executable snapshot guard stays wired in CI.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RouteTierPolicyNavSnapshotArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Route_tier_policy_nav_guard_script_exists()
    {
        string path = Path.Combine(RepoRoot, "scripts", "ci", "assert_route_tier_policy_nav.py");
        File.Exists(path).Should().BeTrue();
    }

    [Fact]
    public void Route_tier_policy_nav_registry_json_exists_and_has_entries()
    {
        string path = Path.Combine(RepoRoot, "scripts", "ci", "data", "route_tier_policy_nav_registry.json");
        File.Exists(path).Should().BeTrue();

        using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
        JsonElement entries = doc.RootElement.GetProperty("entries");
        entries.GetArrayLength().Should().BeGreaterThan(100, "registry must cover controller route families");
    }

    [Fact]
    public void Ci_workflows_invoke_route_tier_policy_nav_guard()
    {
        string ciPath = Path.Combine(RepoRoot, ".github", "workflows", "ci.yml");
        string rcPath = Path.Combine(RepoRoot, ".github", "workflows", "rc-release-gate.yml");

        string ciText = File.ReadAllText(ciPath);
        string rcText = File.ReadAllText(rcPath);

        ciText.Should().Contain("assert_route_tier_policy_nav.py");
        rcText.Should().Contain("assert_route_tier_policy_nav.py");
    }

    [Fact]
    public void Matrix_freshness_marker_matches_registry_entry_count()
    {
        string registryPath = Path.Combine(RepoRoot, "scripts", "ci", "data", "route_tier_policy_nav_registry.json");
        string matrixPath = Path.Combine(RepoRoot, "docs", "library", "ROUTE_TIER_POLICY_NAV_MATRIX.md");

        using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(registryPath));
        int registryCount = doc.RootElement.GetProperty("entries").GetArrayLength();

        string matrixText = File.ReadAllText(matrixPath);
        Match marker = Regex.Match(matrixText, @"<!-- route-tier-policy-nav-registry-count:(\d+) -->");

        marker.Success.Should().BeTrue();
        int.Parse(marker.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture)
            .Should()
            .Be(registryCount);
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
