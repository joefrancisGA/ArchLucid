using FluentAssertions;

namespace ArchLucid.Architecture.Tests.WorkerCapability;

/// <summary>OP-06: every Worker/Combined hosted service is classified in the worker capability map.</summary>
[Trait("Suite", "Architecture")]
public sealed class ProductCapabilityWorkerMapCoverageTests
{
    private static readonly HashSet<string> AllowedCapabilities =
        ["platform", "authority", "infra-evidence", "governance"];

    private static readonly HashSet<string> AllowedStatuses = ["assigned", "disputed"];

    [Fact]
    [Trait("Category", "Unit")]
    public void Product_capability_worker_map_file_exists()
    {
        File.Exists(ProductCapabilityWorkerMapPaths.MapFilePath).Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Every_worker_hosted_service_is_mapped_exactly_once()
    {
        ProductCapabilityWorkerMapDocument document = ProductCapabilityWorkerMapLoader.Load();
        IReadOnlyList<Type> discoveredTypes = WorkerHostedServiceDiscovery.DiscoverWorkerHostedServiceTypes();

        string[] mappedTypeNames = document.HostedServices
            .Select(static entry => entry.TypeName)
            .ToArray();

        mappedTypeNames.Should().OnlyHaveUniqueItems("duplicate hosted-service rows in product-capability-worker-map.json");

        string[] expectedTypeNames = discoveredTypes
            .Select(static type => type.FullName!)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        mappedTypeNames.OrderBy(static name => name, StringComparer.Ordinal)
            .Should()
            .Equal(
                expectedTypeNames,
                "refresh docs/architecture/data/product-capability-worker-map.json via ARCHLUCID_REFRESH_WORKER_CAPABILITY_MAP=1 dotnet test --filter Refresh_worker_capability_map_snapshot");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Hosted_service_rows_use_closed_capability_and_status_sets()
    {
        ProductCapabilityWorkerMapDocument document = ProductCapabilityWorkerMapLoader.Load();

        foreach (ProductCapabilityWorkerMapEntry entry in document.HostedServices)
        {
            AllowedCapabilities.Should().Contain(entry.Capability, $"hosted service {entry.TypeName}");
            AllowedStatuses.Should().Contain(entry.Status, $"hosted service {entry.TypeName}");

            if (entry.Status == "disputed")
                entry.OwnerNote.Should().NotBeNullOrWhiteSpace($"hosted service {entry.TypeName}");
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Document_version_matches_op_06_contract()
    {
        ProductCapabilityWorkerMapDocument document = ProductCapabilityWorkerMapLoader.Load();
        document.Version.Should().Be(1);
    }
}
