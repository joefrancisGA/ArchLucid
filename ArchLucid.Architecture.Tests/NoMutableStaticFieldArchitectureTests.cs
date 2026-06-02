using System.Text;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-014: Application and AgentRuntime avoid mutable static fields (replica-safe DI services instead).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class NoMutableStaticFieldArchitectureTests
{
    private static readonly string[] ScannedRelativeRoots =
    [
        "ArchLucid.Application",
        "ArchLucid.AgentRuntime",
    ];

    [Fact]
    public void Application_and_AgentRuntime_have_no_mutable_static_fields()
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

                foreach (string rawLine in File.ReadAllLines(path, Encoding.UTF8))
                {
                    string line = rawLine.Trim();

                    if (line.Length == 0 || line.StartsWith("//", StringComparison.Ordinal))
                        continue;

                    if (line.StartsWith("using static", StringComparison.Ordinal))
                        continue;

                    if (line.Contains("=>"))
                        continue;

                    if (!line.EndsWith(';'))
                        continue;

                    if (line.Contains("static class", StringComparison.Ordinal))
                        continue;

                    if (!line.Contains(" static ", StringComparison.Ordinal))
                        continue;

                    if (line.Contains(" static readonly ", StringComparison.Ordinal)
                        || line.Contains(" static const ", StringComparison.Ordinal)
                        || line.Contains(" static extern ", StringComparison.Ordinal)
                        || line.Contains(" static event ", StringComparison.Ordinal))
                        continue;

                    violations.Add($"{Path.GetRelativePath(root, path)}: {line}");
                }
            }
        }

        violations.Should().BeEmpty(
            "INV-014: replace mutable static state with scoped/singleton DI services: "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
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
