namespace ArchLucid.Architecture.Tests.WorkerCapability;

/// <summary>Manual refresh: ARCHLUCID_REFRESH_WORKER_CAPABILITY_MAP=1 dotnet test --filter Refresh_worker_capability_map_snapshot</summary>
[Trait("Suite", "Architecture")]
public sealed class ProductCapabilityWorkerMapRefreshTests
{
    [SkippableFact]
    [Trait("Category", "Unit")]
    public void Refresh_worker_capability_map_snapshot()
    {
        Skip.If(Environment.GetEnvironmentVariable("ARCHLUCID_REFRESH_WORKER_CAPABILITY_MAP") != "1");

        ProductCapabilityWorkerMapDocument document = ProductCapabilityWorkerMapWriter.BuildFromDiscovery();
        ProductCapabilityWorkerMapLoader.Save(document);
    }
}
