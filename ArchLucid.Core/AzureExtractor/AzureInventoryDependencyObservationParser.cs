using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>dependency-observations.json</c> companion rows (SN-RT-06).
/// </summary>
public static class AzureInventoryDependencyObservationParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryDependencyObservationRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Dependency observation row must be a JSON object.";

            return false;
        }

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (AzureInventoryDependencyObservationRedactor.ContainsForbiddenProperty(property.Name))
            {
                errorMessage = $"Forbidden property '{property.Name}' is not allowed on dependency observation rows.";

                return false;
            }
        }

        string? observationKind = TryReadBoundedString(element, "observationKind", MaxNameLength);
        string? operationClass = TryReadBoundedString(element, "operationClass", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(observationKind)
            || string.IsNullOrWhiteSpace(operationClass)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "observationKind, operationClass, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryDependencyObservationKinds.IsValid(observationKind))
        {
            errorMessage = $"Unsupported observationKind '{observationKind}'.";

            return false;
        }

        if (!AzureInventoryDependencyObservationOperationClass.IsValid(operationClass))
        {
            errorMessage = $"Unsupported operationClass '{operationClass}'.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        string? sourcePrincipalId = TryReadBoundedString(element, "sourcePrincipalId", MaxIdentifierLength);
        string? sourceAppRoleName = TryReadBoundedString(element, "sourceAppRoleName", MaxNameLength);
        string? targetHost = TryReadBoundedString(element, "targetHost", MaxNameLength);
        string? targetArmId = TryReadBoundedString(element, "targetArmId", MaxIdentifierLength);
        string? targetCatalog = TryReadBoundedString(element, "targetCatalog", MaxNameLength);
        string? workspaceId = TryReadBoundedString(element, "workspaceId", MaxIdentifierLength);
        string? windowStartUtc = TryReadBoundedString(element, "windowStartUtc", MaxNameLength);
        string? windowEndUtc = TryReadBoundedString(element, "windowEndUtc", MaxNameLength);

        if (string.IsNullOrWhiteSpace(sourcePrincipalId) && string.IsNullOrWhiteSpace(sourceAppRoleName))
        {
            errorMessage = "sourcePrincipalId or sourceAppRoleName is required.";

            return false;
        }

        if (AzureInventoryDependencyObservationRedactor.ShouldRejectValue(targetHost)
            || AzureInventoryDependencyObservationRedactor.ShouldRejectValue(targetCatalog)
            || AzureInventoryDependencyObservationRedactor.ShouldRejectValue(sourceAppRoleName))
        {
            errorMessage = "Companion row contains rejected secret-like content.";

            return false;
        }

        long eventCount = 0;

        if (element.TryGetProperty("eventCount", out JsonElement eventCountElement))
        {
            if (eventCountElement.ValueKind is JsonValueKind.Number && eventCountElement.TryGetInt64(out long parsedCount))
            {
                eventCount = parsedCount;
            }
            else
            {
                errorMessage = "eventCount must be a number when present.";

                return false;
            }
        }

        row = new AzureInventoryDependencyObservationRow
        {
            SourcePrincipalId = sourcePrincipalId,
            SourceAppRoleName = sourceAppRoleName,
            TargetHost = targetHost,
            TargetArmId = targetArmId,
            TargetCatalog = targetCatalog,
            ObservationKind = observationKind.Trim(),
            OperationClass = operationClass.Trim(),
            EventCount = eventCount,
            WindowStartUtc = windowStartUtc,
            WindowEndUtc = windowEndUtc,
            WorkspaceId = workspaceId,
            CollectionStatus = collectionStatus.Trim(),
        };

        return true;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
