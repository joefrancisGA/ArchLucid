using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Manifests;

/// <summary>
///     Honest export labels for manifest topology enums when the value is schema-default <c>Unknown</c>.
/// </summary>
public static class ArchitectureManifestTopologyExport
{
    public static string FormatServiceTypeForExport(ServiceType serviceType) =>
        serviceType == ServiceType.Unknown ? "Service type was not stored." : serviceType.ToString();

    public static string FormatDatastoreTypeForExport(DatastoreType datastoreType) =>
        datastoreType == DatastoreType.Unknown ? "Datastore type was not stored." : datastoreType.ToString();

    public static string FormatRuntimePlatformForExport(RuntimePlatform runtimePlatform) =>
        runtimePlatform == RuntimePlatform.Unknown ? "Runtime platform was not stored." : runtimePlatform.ToString();
}
