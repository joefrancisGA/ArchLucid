namespace ArchLucid.Architecture.Tests.WorkerCapability;

internal sealed class ProductCapabilityWorkerMapEntry
{
    public string TypeName { get; set; } = string.Empty;

    public string Capability { get; set; } = string.Empty;

    public string Status { get; set; } = "assigned";

    public string? OwnerNote { get; set; }
}
