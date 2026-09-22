using System.Reflection;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.ProductCapability;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>OP-02: guarded Application namespaces must not grow new authority dependencies.</summary>
[Trait("Suite", "Architecture")]
public sealed class ProductCapabilityNamespaceRatchetTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Product_capability_namespace_allowlist_file_exists()
    {
        File.Exists(ProductCapabilityNamespaceAllowlistLoader.AllowlistFilePath).Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Guarded_application_types_must_not_add_new_authority_namespace_dependencies()
    {
        ProductCapabilityMapDocument map = ProductCapabilityMapLoader.Load();
        ProductCapabilityNamespaceAllowlistDocument allowlist = ProductCapabilityNamespaceAllowlistLoader.Load();

        IReadOnlyList<ProductCapabilityNamespaceViolation> discovered =
            ProductCapabilityNamespaceRatchetEvaluator.DiscoverViolations(map);

        HashSet<(string TypeName, string ForbiddenPrefix)> allowed = allowlist.Entries
            .Select(static entry => (entry.TypeName, entry.ForbiddenPrefix))
            .ToHashSet();

        List<ProductCapabilityNamespaceViolation> unlisted = discovered
            .Where(violation => !allowed.Contains((violation.TypeName, violation.ForbiddenPrefix)))
            .ToList();

        unlisted.Should().BeEmpty(
            "new cross-capability dependencies must be removed or added to product-capability-namespace-allowlist.json with reason. "
            + "Offenders: {0}",
            string.Join(
                Environment.NewLine,
                unlisted.Select(static violation => $"{violation.TypeName} -> {violation.ForbiddenPrefix}")));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Namespace_allowlist_entries_must_still_violate_or_exist()
    {
        ProductCapabilityMapDocument map = ProductCapabilityMapLoader.Load();
        ProductCapabilityNamespaceAllowlistDocument allowlist = ProductCapabilityNamespaceAllowlistLoader.Load();

        IReadOnlyList<ProductCapabilityNamespaceViolation> discovered =
            ProductCapabilityNamespaceRatchetEvaluator.DiscoverViolations(map);

        HashSet<(string TypeName, string ForbiddenPrefix)> discoveredSet = discovered
            .Select(static violation => (violation.TypeName, violation.ForbiddenPrefix))
            .ToHashSet();

        Assembly applicationAssembly = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        HashSet<string> applicationTypeNames = applicationAssembly
            .GetTypes()
            .Where(static type => type.FullName is not null)
            .Select(static type => type.FullName!)
            .ToHashSet(StringComparer.Ordinal);

        List<string> staleEntries = [];

        foreach (ProductCapabilityNamespaceAllowlistEntry entry in allowlist.Entries)
        {
            if (!applicationTypeNames.Contains(entry.TypeName))
            {
                staleEntries.Add($"{entry.TypeName} (type missing)");
                continue;
            }

            if (!discoveredSet.Contains((entry.TypeName, entry.ForbiddenPrefix)))
                staleEntries.Add($"{entry.TypeName} -> {entry.ForbiddenPrefix} (dependency removed; shrink allowlist)");
        }

        staleEntries.Should().BeEmpty(
            "remove stale rows from product-capability-namespace-allowlist.json. Stale: {0}",
            string.Join(Environment.NewLine, staleEntries));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void InfraEvidence_types_must_not_reference_Application_Runs_without_allowlist()
    {
        // Documents the ratchet rule: a new InfraEvidence -> Runs edge fails unless explicitly allowlisted.
        TestResult result = Types
            .InAssembly(typeof(ArchitectureRunCreateOrchestrator).Assembly)
            .That()
            .ResideInNamespace("ArchLucid.Application.InfraEvidence")
            .ShouldNot()
            .HaveDependencyOnAny("ArchLucid.Application.Runs")
            .GetResult();

        if (result.IsSuccessful)
            return;

        ProductCapabilityNamespaceAllowlistDocument allowlist = ProductCapabilityNamespaceAllowlistLoader.Load();
        IReadOnlyList<Type> failingTypes = result.FailingTypes ?? [];

        foreach (Type failingType in failingTypes)
        {
            string failingTypeName = failingType.FullName ?? failingType.Name;
            bool allowlisted = allowlist.Entries.Any(
                entry =>
                    string.Equals(entry.TypeName, failingTypeName, StringComparison.Ordinal)
                    && string.Equals(entry.ForbiddenPrefix, "ArchLucid.Application.Runs", StringComparison.Ordinal));

            allowlisted.Should().BeTrue(
                because: "InfraEvidence -> Runs must be allowlisted until the dependency is removed. Type: {0}",
                failingTypeName);
        }
    }
}
