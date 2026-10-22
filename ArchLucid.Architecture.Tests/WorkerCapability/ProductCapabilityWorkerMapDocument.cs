namespace ArchLucid.Architecture.Tests.WorkerCapability;

internal sealed class ProductCapabilityWorkerMapDocument
{
    public int Version { get; set; }

    public List<ProductCapabilityWorkerMapEntry> HostedServices { get; set; } = [];
}
