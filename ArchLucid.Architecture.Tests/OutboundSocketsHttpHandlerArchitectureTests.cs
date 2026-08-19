using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-2163 — every product <c>AddHttpClient</c> registration wires tuned sockets handlers.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboundSocketsHttpHandlerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly string[] ScannedRoots =
    [
        Path.Combine(RepoRoot, "ArchLucid.Host.Composition", "Startup"),
        Path.Combine(RepoRoot, "ArchLucid.Api"),
    ];

    private static readonly Regex AddHttpClientRegex = new(
        @"\.AddHttpClient\b",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex TunedHandlerRegex = new(
        @"ConfigureArchLucidOutboundSocketsHandler|AddOutboundExternalHttpResilience|AddLongLivedPolicyHandler",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Tb2163_product_AddHttpClient_registrations_wire_tuned_sockets_handlers()
    {
        List<string> violations = [];

        foreach (string root in ScannedRoots)
        {
            foreach (string path in Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories))
            {
                string text = File.ReadAllText(path);
                MatchCollection matches = AddHttpClientRegex.Matches(text);

                if (matches.Count == 0)
                    continue;

                if (!TunedHandlerRegex.IsMatch(text))
                {
                    violations.Add($"{Path.GetRelativePath(RepoRoot, path)}: AddHttpClient without tuned handler wiring");
                }
            }
        }

        violations.Should().BeEmpty(
            "TB-2163: chain ConfigureArchLucidOutboundSocketsHandler, AddOutboundExternalHttpResilience, or AddLongLivedPolicyHandler on every AddHttpClient site. Violations: "
            + string.Join("; ", violations));
    }

    [Fact]
    public void Tb2163_shared_handler_modules_exist()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Core", "Http", "OutboundSocketsHttpHandlerSettings.cs"))
            .Should()
            .BeTrue();
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Http", "OutboundSocketsHttpClientBuilderExtensions.cs"))
            .Should()
            .BeTrue();
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

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
