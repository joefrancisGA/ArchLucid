using System.Reflection;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-2335: regression guard so new outbound probe / HttpClient adapters cannot land in
///     <c>ArchLucid.Api</c> while <strong>TB-2333</strong>/<strong>TB-2334</strong> drain the grandfathered set.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApiWebLayerOutboundAdapterArchitectureTests
{
    private static readonly Regex ApiWebLayerAddHttpClientImplementationRegex = new(
        @"AddHttpClient\s*<\s*[^,>]+,\s*(?<Implementation>[A-Za-z_][A-Za-z0-9_]*)\s*>",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Api_must_not_host_new_outbound_probe_or_connectivity_adapter_implementations()
    {
        HashSet<string> allowlisted = new(
            ApiWebLayerOutboundAdapterArchitectureConstants.AllowlistedOutboundAdapterImplementationTypeNames,
            StringComparer.Ordinal);

        List<string> violations = [];

        foreach (Type type in EnumerateApiConcreteClasses())
        {

            if (!MatchesForbiddenOutboundAdapterTypeName(type.Name))
                continue;

            if (!allowlisted.Contains(type.Name))
                violations.Add(type.FullName ?? type.Name);
        }

        violations.Should().BeEmpty(
            because:
            "TB-2335: outbound probe/connectivity adapters belong in Host.Composition behind Application ports; "
            + "grandfather only via ApiWebLayerOutboundAdapterArchitectureConstants until TB-2333/TB-2334. "
            + "Violations: {0}",
            violations.Count == 0 ? "(none)" : string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void Allowlisted_outbound_adapter_types_must_still_exist_in_Api_until_moved()
    {
        HashSet<string> present = EnumerateApiConcreteClasses()
            .Select(static type => type.Name)
            .ToHashSet(StringComparer.Ordinal);

        string[] missing = ApiWebLayerOutboundAdapterArchitectureConstants
            .AllowlistedOutboundAdapterImplementationTypeNames
            .Where(name => !present.Contains(name))
            .ToArray();

        missing.Should().BeEmpty(
            because:
            "TB-2335 allowlist must track adapters still in Api; remove names from "
            + "ApiWebLayerOutboundAdapterArchitectureConstants when TB-2333/TB-2334 moves them. Missing: {0}",
            string.Join(", ", missing));
    }

    [Fact]
    public void ApiWebLayerServiceCollectionExtensions_must_not_register_new_AddHttpClient_adapters()
    {
        string path = Path.Combine(
            ArchitectureConstraintRepositoryPaths.RepositoryRoot,
            ApiWebLayerOutboundAdapterArchitectureConstants.ApiWebLayerServiceCollectionExtensionsRelativePath);

        File.Exists(path).Should().BeTrue(because: "Api web-layer DI extension must exist at {0}", path);

        HashSet<string> allowlisted = new(
            ApiWebLayerOutboundAdapterArchitectureConstants.AllowlistedApiWebLayerAddHttpClientImplementationTypeNames,
            StringComparer.Ordinal);

        List<string> violations = [];

        foreach (Match match in ApiWebLayerAddHttpClientImplementationRegex.Matches(File.ReadAllText(path)))
        {
            string implementation = match.Groups["Implementation"].Value;

            if (!allowlisted.Contains(implementation))
                violations.Add(implementation);
        }

        violations.Should().BeEmpty(
            because:
            "TB-2335: new outbound HttpClient adapters must register in Host.Composition, not "
            + "ApiWebLayerServiceCollectionExtensions; allowlist current call sites until TB-2333/TB-2334/TB-2339. "
            + "Violations: {0}",
            violations.Count == 0 ? "(none)" : string.Join(", ", violations));
    }

    private static IEnumerable<Type> EnumerateApiConcreteClasses()
    {
        Assembly apiAssembly = ArchitectureConstraintAssemblies.Resolve(
            ApiWebLayerOutboundAdapterArchitectureConstants.ApiAssemblyName);

        foreach (Type type in apiAssembly.GetTypes())
        {

            if (!type.IsClass || type.IsAbstract)
                continue;

            yield return type;
        }
    }

    private static bool MatchesForbiddenOutboundAdapterTypeName(string typeName)
    {
        foreach (string suffix in ApiWebLayerOutboundAdapterArchitectureConstants.ForbiddenOutboundAdapterTypeNameSuffixes)
        {

            if (typeName.EndsWith(suffix, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
