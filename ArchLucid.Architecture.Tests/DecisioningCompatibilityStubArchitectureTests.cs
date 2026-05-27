using System.Reflection;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Improvement #21 / Batch G: compatibility stubs in <c>ArchLucid.Decisioning</c> must stay on the
///     documented allowlist and inherit canonical Core ports only.
/// </summary>
[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]
public sealed class DecisioningCompatibilityStubArchitectureTests
{
    private static readonly Regex CompatibilityStubMarker = new(
        "Compatibility stub",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    [Fact]
    public void Decisioning_compatibility_stub_files_must_match_allowlist()
    {
        string root = FindRepositoryRoot();
        string decisioningRoot = Path.Combine(root, "ArchLucid.Decisioning");

        HashSet<string> discovered = DiscoverCompatibilityStubRelativePaths(decisioningRoot, root);
        HashSet<string> allowlisted = ArchitectureConstraintCompatibilityStubCatalog.DecisioningStubs
            .Select(static entry => entry.RelativeSourcePath.Replace('\\', '/'))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        discovered.Should().BeEquivalentTo(
            allowlisted,
            because:
            "every Decisioning compatibility stub must be allowlisted in ArchitectureConstraintCompatibilityStubCatalog "
            + "and no undocumented stubs may be added.");
    }

    [Fact]
    public void Decisioning_compatibility_stub_allowlist_files_must_exist_on_disk()
    {
        string root = FindRepositoryRoot();

        foreach (ArchitectureConstraintCompatibilityStubEntry entry in ArchitectureConstraintCompatibilityStubCatalog.DecisioningStubs)
        {
            string fullPath = Path.Combine(root, entry.RelativeSourcePath.Replace('/', Path.DirectorySeparatorChar));

            File.Exists(fullPath).Should().BeTrue(
                because: "allowlisted stub {0} must exist at {1}",
                entry.StubInterfaceName,
                entry.RelativeSourcePath);
        }
    }

    [Fact]
    public void Decisioning_compatibility_stubs_must_inherit_canonical_port()
    {
        Assembly decisioning = typeof(ArchLucid.Decisioning.Alerts.AlertEvaluator).Assembly;

        foreach (ArchitectureConstraintCompatibilityStubEntry entry in ArchitectureConstraintCompatibilityStubCatalog.DecisioningStubs)
        {
            Type? stubType = decisioning.GetType(
                InferDecisioningStubTypeName(entry.RelativeSourcePath, entry.StubInterfaceName),
                throwOnError: false,
                ignoreCase: false);

            stubType.Should().NotBeNull(
                because: "allowlisted stub interface {0} must be loadable from Decisioning",
                entry.StubInterfaceName);

            stubType!.IsInterface.Should().BeTrue(
                because: "{0} must remain an interface forwarding to the canonical port",
                entry.StubInterfaceName);

            Type canonicalType = Type.GetType($"{entry.CanonicalTypeFullName}, ArchLucid.Core", throwOnError: true)!;

            stubType.GetInterfaces().Should().Contain(
                canonicalType,
                because: "{0} must inherit {1} so Decisioning callers resolve the same contract",
                entry.StubInterfaceName,
                entry.CanonicalTypeFullName);
        }
    }

    [Fact]
    public void Decisioning_compatibility_stubs_must_not_add_undocumented_members()
    {
        foreach (ArchitectureConstraintCompatibilityStubEntry entry in ArchitectureConstraintCompatibilityStubCatalog.DecisioningStubs)
        {
            string root = FindRepositoryRoot();
            string fullPath = Path.Combine(root, entry.RelativeSourcePath.Replace('/', Path.DirectorySeparatorChar));
            string text = File.ReadAllText(fullPath);

            text.Should().Contain(
                "Compatibility stub",
                because: "{0} must document that it is a compatibility stub",
                entry.StubInterfaceName);

            bool declaresDecisioningSpecificMember = DeclaresDecisioningSpecificInterfaceMember(text);

            if (entry.AllowsLegacyTypeBridge)
            {
                declaresDecisioningSpecificMember.Should().BeTrue(
                    because: "{0} is allowlisted as a legacy type bridge and must expose Decisioning-specific members",
                    entry.StubInterfaceName);
            }
            else
            {
                declaresDecisioningSpecificMember.Should().BeFalse(
                    because: "{0} must be a pure alias; only allowlisted bridging stubs may declare extra members",
                    entry.StubInterfaceName);
            }
        }
    }

    private static bool DeclaresDecisioningSpecificInterfaceMember(string sourceText)
    {
        foreach (string line in sourceText.Split('\n'))
        {
            string trimmed = line.Trim();

            if (trimmed.StartsWith("//", StringComparison.Ordinal)
                || trimmed.StartsWith("///", StringComparison.Ordinal)
                || trimmed.StartsWith('*')
                || trimmed.StartsWith("public interface", StringComparison.Ordinal)
                || trimmed.StartsWith("}", StringComparison.Ordinal)
                || trimmed.StartsWith("{", StringComparison.Ordinal))
            {
                continue;
            }

            // Explicit interface implementation lines are expected on bridging stubs only.
            if (trimmed.Contains("ArchLucid.Core.", StringComparison.Ordinal)
                && trimmed.Contains('.', StringComparison.Ordinal))
            {
                continue;
            }

            if (trimmed.Contains('(') && trimmed.EndsWith(";", StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static HashSet<string> DiscoverCompatibilityStubRelativePaths(string decisioningRoot, string repositoryRoot)
    {
        HashSet<string> discovered = new(StringComparer.OrdinalIgnoreCase);

        foreach (string path in Directory.EnumerateFiles(decisioningRoot, "*.cs", SearchOption.AllDirectories))
        {
            if (path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal)
                || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
            {
                continue;
            }

            string text = File.ReadAllText(path);

            if (!CompatibilityStubMarker.IsMatch(text))
            {
                continue;
            }

            string relative = Path.GetRelativePath(repositoryRoot, path).Replace('\\', '/');
            discovered.Add(relative);
        }

        return discovered;
    }

    private static string InferDecisioningStubTypeName(string relativeSourcePath, string stubInterfaceName)
    {
        string normalized = relativeSourcePath.Replace('\\', '/');
        int decisioningIndex = normalized.IndexOf("ArchLucid.Decisioning/", StringComparison.Ordinal);

        if (decisioningIndex < 0)
        {
            return stubInterfaceName;
        }

        string suffix = normalized[(decisioningIndex + "ArchLucid.Decisioning/".Length)..];
        string namespaceSuffix = suffix[..suffix.LastIndexOf('/')].Replace('/', '.');
        return $"ArchLucid.Decisioning.{namespaceSuffix}.{stubInterfaceName}";
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
}
