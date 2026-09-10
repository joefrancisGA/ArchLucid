using ArchLucid.Architecture.Tests.DependencyInjection;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>OP-01: every API controller and Application namespace cluster is classified in the capability map.</summary>
[Trait("Suite", "Architecture")]
public sealed class ProductCapabilityMapCoverageTests
{
    private static readonly HashSet<string> AllowedCapabilities =
        ["platform", "authority", "infra-evidence", "governance"];

    private static readonly HashSet<string> AllowedProductLines = ["architecture", "security", "both"];

    private static readonly HashSet<string> AllowedStatuses = ["assigned", "disputed"];

    [Fact]
    [Trait("Category", "Unit")]
    public void Product_capability_map_file_exists()
    {
        File.Exists(ProductCapabilityMapPaths.MapFilePath).Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Every_api_controller_is_mapped_exactly_once()
    {
        ProductCapabilityMapDocument document = ProductCapabilityMapLoader.Load();
        IReadOnlyList<Type> controllerTypes = ApiHostControllerAndHandlerDiscovery.DiscoverControllerTypes();

        string[] mappedTypeNames = document.Controllers
            .Select(static entry => entry.TypeName)
            .ToArray();

        mappedTypeNames.Should().OnlyHaveUniqueItems("duplicate controller rows in product-capability-map.json");

        string[] expectedTypeNames = controllerTypes
            .Select(static type => type.FullName!)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        mappedTypeNames.OrderBy(static name => name, StringComparer.Ordinal)
            .Should()
            .Equal(
                expectedTypeNames,
                "update docs/architecture/data/product-capability-map.json via scripts/ci/build_product_capability_map.py");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Controller_rows_use_closed_capability_product_line_and_status_sets()
    {
        ProductCapabilityMapDocument document = ProductCapabilityMapLoader.Load();

        foreach (ProductCapabilityMapControllerEntry entry in document.Controllers)
        {
            AllowedCapabilities.Should().Contain(entry.Capability, $"controller {entry.TypeName}");
            AllowedProductLines.Should().Contain(entry.ProductLine, $"controller {entry.TypeName}");
            AllowedStatuses.Should().Contain(entry.Status, $"controller {entry.TypeName}");

            if (entry.Status == "disputed")
                entry.OwnerNote.Should().NotBeNullOrWhiteSpace($"controller {entry.TypeName}");
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Application_namespace_rows_use_closed_sets_and_required_prefixes()
    {
        ProductCapabilityMapDocument document = ProductCapabilityMapLoader.Load();

        string[] namespacePrefixes = document.ApplicationNamespaces
            .Select(static entry => entry.NamespacePrefix)
            .ToArray();

        namespacePrefixes.Should().OnlyHaveUniqueItems();

        foreach (ProductCapabilityMapApplicationNamespaceEntry entry in document.ApplicationNamespaces)
        {
            AllowedCapabilities.Should().Contain(entry.Capability, $"namespace {entry.NamespacePrefix}");
            AllowedStatuses.Should().Contain(entry.Status, $"namespace {entry.NamespacePrefix}");

            if (entry.Status == "disputed")
                entry.OwnerNote.Should().NotBeNullOrWhiteSpace($"namespace {entry.NamespacePrefix}");
        }

        foreach (string requiredPrefix in document.RequiredApplicationNamespacePrefixes)
        {
            namespacePrefixes.Should().Contain(requiredPrefix);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Document_version_and_capabilities_match_op_01_contract()
    {
        ProductCapabilityMapDocument document = ProductCapabilityMapLoader.Load();

        document.Version.Should().Be(1);
        document.Capabilities.Should().Equal(["platform", "authority", "infra-evidence", "governance"]);
        document.AlwaysAllowedRoutePrefixes.Should().Contain("/health");
        document.AlwaysAllowedRoutePrefixes.Should().Contain("/openapi");
    }
}
