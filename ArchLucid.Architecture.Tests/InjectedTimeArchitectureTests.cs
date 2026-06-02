using System.Text;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-007: production assemblies avoid naked <c>DateTime.UtcNow</c> / <c>DateTime.Now</c>; prefer <c>TimeProvider</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InjectedTimeArchitectureTests
{
    private static readonly string[] ScannedRelativeRoots =
    [
        "ArchLucid.Application",
        "ArchLucid.AgentRuntime",
    ];

    private static readonly HashSet<string> AllowedRawClockFiles =
    [
    ];

    [Fact]
    public void Application_and_AgentRuntime_avoid_raw_DateTime_clock_reads()
    {
        string root = FindRepoRoot();
        List<string> violations = [];

        foreach (string rel in ScannedRelativeRoots)
        {
            string dir = Path.Combine(root, rel);

            if (!Directory.Exists(dir))
                continue;

            foreach (string path in Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories))
            {
                if (IsBuildOutput(path))
                    continue;

                if (AllowedRawClockFiles.Contains(Path.GetFileName(path)))
                    continue;

                string text = File.ReadAllText(path, Encoding.UTF8);

                if (text.Contains("DateTime.UtcNow", StringComparison.Ordinal)
                    || text.Contains("DateTime.Now", StringComparison.Ordinal))
                {
                    violations.Add(Path.GetRelativePath(root, path));
                }
            }
        }

        violations.Should().BeEmpty(
            "INV-007: use TimeProvider / IClock instead of DateTime.UtcNow/Now in Application and AgentRuntime: "
            + string.Join("; ", violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    [Fact]
    public void LlmTenantWalletService_injects_TimeProvider()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Application", "Budgeting", "LlmTenantWalletService.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path, Encoding.UTF8);

        text.Should().Contain("TimeProvider timeProvider");
        text.Should().Contain("_timeProvider");
    }

    private static bool IsBuildOutput(string path) =>
        path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
        || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase);

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }
}
