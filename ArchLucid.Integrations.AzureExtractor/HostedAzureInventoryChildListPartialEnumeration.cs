using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureInventoryChildListPartialEnumeration
{
    internal static void NotePartialCollection(
        ILogger logger,
        HostedAzureArmChildCollectionReadResult listResult,
        string parentResourceId,
        string collectionLabel,
        List<string>? collectionWarnings,
        string? collectionWarningCode)
    {
        if (!listResult.PartialCollection)
        {
            return;
        }

        if (collectionWarnings is not null && !string.IsNullOrWhiteSpace(collectionWarningCode))
        {
            collectionWarnings.Add(collectionWarningCode);
        }

        if (logger.IsEnabled(LogLevel.Warning))
        {
            logger.LogWarning(
                "Hosted Azure extractor retained a partial {CollectionLabel} list for {ParentResourceId} after ARM pagination stopped early.",
                collectionLabel,
                parentResourceId.Trim());
        }
    }
}
