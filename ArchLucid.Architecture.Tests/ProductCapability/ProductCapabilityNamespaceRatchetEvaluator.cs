using System.Reflection;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.ProductCapability;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>Finds Application types in guarded capabilities that depend on authority namespaces.</summary>
internal static class ProductCapabilityNamespaceRatchetEvaluator
{
    private static readonly HashSet<string> GuardedCapabilities =
        new(StringComparer.Ordinal) { "infra-evidence", "governance", "platform" };

    internal static IReadOnlyList<string> ResolveForbiddenAuthorityPrefixes(ProductCapabilityMapDocument map)
    {
        List<string> prefixes =
        [
            "ArchLucid.Application.Runs",
            "ArchLucid.Application.Planning",
            "ArchLucid.Api.Controllers.Authority",
            "ArchLucid.Api.Controllers.Architecture",
        ];

        foreach (ProductCapabilityMapApplicationNamespaceEntry entry in map.ApplicationNamespaces)
        {
            if (!string.Equals(entry.Capability, "authority", StringComparison.Ordinal))
                continue;

            // Root Application namespace is every type; only sub-namespaces are meaningful authority cuts.
            if (string.Equals(entry.NamespacePrefix, "ArchLucid.Application", StringComparison.Ordinal))
                continue;

            if (!prefixes.Contains(entry.NamespacePrefix))
                prefixes.Add(entry.NamespacePrefix);
        }

        prefixes.Sort(StringComparer.Ordinal);
        return prefixes;
    }

    internal static IReadOnlyList<string> ResolveGuardedNamespacePrefixes(ProductCapabilityMapDocument map)
    {
        List<string> prefixes = map.ApplicationNamespaces
            .Where(static entry => GuardedCapabilities.Contains(entry.Capability))
            .Select(static entry => entry.NamespacePrefix)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(static prefix => prefix, StringComparer.Ordinal)
            .ToList();

        return prefixes;
    }

    internal static IReadOnlyList<ProductCapabilityNamespaceViolation> DiscoverViolations(
        ProductCapabilityMapDocument map)
    {
        IReadOnlyList<string> guardedPrefixes = ResolveGuardedNamespacePrefixes(map);
        IReadOnlyList<string> forbiddenPrefixes = ResolveForbiddenAuthorityPrefixes(map);
        Assembly applicationAssembly = typeof(ArchitectureRunCreateOrchestrator).Assembly;

        List<ProductCapabilityNamespaceViolation> violations = [];

        foreach (string guardedPrefix in guardedPrefixes)
        {
            foreach (string forbiddenPrefix in forbiddenPrefixes)
            {
                TestResult result = Types
                    .InAssembly(applicationAssembly)
                    .That()
                    .ResideInNamespace(guardedPrefix)
                    .ShouldNot()
                    .HaveDependencyOnAny(forbiddenPrefix)
                    .GetResult();

                if (result.FailingTypes is null)
                    continue;

                foreach (Type failingType in result.FailingTypes)
                {
                    string typeName = failingType.FullName ?? failingType.Name;
                    violations.Add(new ProductCapabilityNamespaceViolation(typeName, forbiddenPrefix));
                }
            }
        }

        return violations
            .Distinct()
            .OrderBy(static violation => violation.TypeName, StringComparer.Ordinal)
            .ThenBy(static violation => violation.ForbiddenPrefix, StringComparer.Ordinal)
            .ToList();
    }
}
