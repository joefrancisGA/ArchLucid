using System.Text;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-029: Decisioning must not depend on notification delivery infrastructure (<c>ArchLucid.Notifications</c>).
///     Webhook and chat-ops channels register in <c>ArchLucid.Host.Composition</c> only.
/// </summary>
[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]
public sealed class DecisioningNotificationsBoundaryArchitectureTests
{
    private const string ForbiddenNamespace = "ArchLucid.Notifications";

    [Fact]
    public void Decisioning_csproj_must_not_reference_Notifications_assembly()
    {
        string root = FindRepositoryRoot();
        string csprojPath = Path.Combine(root, "ArchLucid.Decisioning", "ArchLucid.Decisioning.csproj");
        string[] declaredReferences = ReadProjectReferenceAssemblyNames(csprojPath).ToArray();

        declaredReferences.Should().NotContain(
            "ArchLucid.Notifications",
            because: "Decisioning must not compile against notification infrastructure (TB-029).");
    }

    [Fact]
    public void Decisioning_source_must_not_import_Notifications_namespace()
    {
        string root = FindRepositoryRoot();
        string decisioningRoot = Path.Combine(root, "ArchLucid.Decisioning");
        List<string> violations = [];

        foreach (string path in Directory.EnumerateFiles(decisioningRoot, "*.cs", SearchOption.AllDirectories))
        {
            if (path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal)
                || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
            {
                continue;
            }

            string text = File.ReadAllText(path, Encoding.UTF8);

            if (text.Contains($"using {ForbiddenNamespace}", StringComparison.Ordinal)
                || text.Contains($"{ForbiddenNamespace}.", StringComparison.Ordinal))
            {
                violations.Add(Path.GetRelativePath(root, path));
            }
        }

        violations.Should().BeEmpty(
            because: "Decisioning source must publish domain outcomes through Core/Contracts ports; "
                     + "notification adapters belong in Host.Composition / ArchLucid.Notifications.");
    }

    private static string FindRepositoryRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string solutionPath = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(solutionPath))
            {
                return directory.FullName;
            }
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    private static IEnumerable<string> ReadProjectReferenceAssemblyNames(string csprojPath)
    {
        Regex projectReferenceInclude = new(
            "<ProjectReference\\s+Include=\"([^\"]+)\"",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

        string text = File.ReadAllText(csprojPath);
        MatchCollection matches = projectReferenceInclude.Matches(text);

        foreach (Match match in matches)
        {
            if (!match.Success)
            {
                continue;
            }

            string includePath = match.Groups[1].Value.Replace('\\', '/');
            string folderName = Path.GetFileName(Path.GetDirectoryName(includePath.TrimEnd('/')) ?? includePath);

            if (!string.IsNullOrWhiteSpace(folderName))
            {
                yield return folderName;
            }
        }
    }
}
