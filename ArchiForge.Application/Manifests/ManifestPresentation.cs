using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Application.Manifests;

public static class ManifestPresentation
{
    public static string ResolveComponentName(string componentId, GoldenManifest manifest)
    {
        if (string.IsNullOrWhiteSpace(componentId))
            return componentId;

        var service = manifest.Services.FirstOrDefault(s =>
            s.ServiceId.Equals(componentId, StringComparison.OrdinalIgnoreCase));
        if (service is not null)
            return service.ServiceName;

        var datastore = manifest.Datastores.FirstOrDefault(d =>
            d.DatastoreId.Equals(componentId, StringComparison.OrdinalIgnoreCase));
        if (datastore is not null)
            return datastore.DatastoreName;

        return componentId;
    }

    public static string RelationshipLabel(RelationshipType relationshipType)
    {
        return relationshipType switch
        {
            RelationshipType.Calls => "calls",
            RelationshipType.ReadsFrom => "reads",
            RelationshipType.WritesTo => "writes",
            RelationshipType.PublishesTo => "publishes",
            RelationshipType.SubscribesTo => "subscribes",
            RelationshipType.AuthenticatesWith => "auth",
            _ => relationshipType.ToString()
        };
    }
}

