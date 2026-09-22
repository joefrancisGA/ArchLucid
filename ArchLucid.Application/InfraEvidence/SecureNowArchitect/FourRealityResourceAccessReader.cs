using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class FourRealityResourceAccessReader
{
    public static IReadOnlyDictionary<string, string> BuildPropertyBag(
        AzureInventorySnapshotDetailReadModel snapshot,
        Guid cloudResourceId)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        AzureInventoryResourceRecord? resource = snapshot.Resources
            .FirstOrDefault(item => item.CloudResourceId == cloudResourceId);

        if (resource is null)
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in snapshot.Properties)
        {

            if (property.ResourceRowId != resource.ResourceRowId)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(property.PropertyKey) || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            properties[property.PropertyKey] = property.PropertyValue.Trim();
        }

        return properties;
    }

    public static FourRealityAccessPosture ReadObservedPosture(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        foreach (KeyValuePair<string, string> entry in properties)
        {

            if (entry.Key.Contains("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && entry.Value.Equals("true", StringComparison.OrdinalIgnoreCase))
            {
                return FourRealityAccessPosture.Public;
            }

            if (entry.Key.Contains("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && !entry.Value.Equals("Disabled", StringComparison.OrdinalIgnoreCase)
                && !entry.Value.Equals("false", StringComparison.OrdinalIgnoreCase))
            {
                return FourRealityAccessPosture.Public;
            }
        }

        if (properties.Keys.Any(key => key.Contains("privateEndpointConnections", StringComparison.OrdinalIgnoreCase)))
        {
            return FourRealityAccessPosture.Private;
        }

        foreach (KeyValuePair<string, string> entry in properties)
        {

            if (entry.Key.Contains("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && entry.Value.Equals("false", StringComparison.OrdinalIgnoreCase))
            {
                return FourRealityAccessPosture.Private;
            }

            if (entry.Key.Contains("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && entry.Value.Equals("Disabled", StringComparison.OrdinalIgnoreCase))
            {
                return FourRealityAccessPosture.Private;
            }
        }

        return FourRealityAccessPosture.Unknown;
    }

    public static FourRealityAccessPosture ReadTerraformIntendedPosture(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? value))
        {
            return ParseDeclaredAccessValue(value);
        }

        return FourRealityAccessPosture.Unknown;
    }

    public static FourRealityAccessPosture ReadHistoricalPosture(
        IReadOnlyDictionary<string, string>? priorProperties,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        Guid cloudResourceId)
    {
        AzureInventoryChangeRecord? wideningChange = changes
            .Where(change => change.CloudResourceId == cloudResourceId)
            .Where(change => change.ChangeType is AzureInventoryChangeType.NetworkExposureChanged
                or AzureInventoryChangeType.PermissionChanged)
            .FirstOrDefault(change => ObservedWideningChange(change));

        if (wideningChange is not null)
        {
            return FourRealityAccessPosture.Private;
        }

        if (priorProperties is null || priorProperties.Count == 0)
        {
            return FourRealityAccessPosture.Unknown;
        }

        FourRealityAccessPosture priorObserved = ReadObservedPosture(priorProperties);

        if (priorObserved == FourRealityAccessPosture.Private)
        {
            return FourRealityAccessPosture.Private;
        }

        return FourRealityAccessPosture.Unknown;
    }

    public static FourRealityAccessPosture ReadDiagramPosture(
        DiagramInfrastructureReconciliationResult? reconciliation,
        Guid cloudResourceId)
    {
        if (reconciliation is null)
        {
            return FourRealityAccessPosture.Unknown;
        }

        DiagramInfrastructureCorrespondenceRow? row = reconciliation.Rows
            .FirstOrDefault(item => item.CloudResourceId == cloudResourceId);

        if (row is null || string.IsNullOrWhiteSpace(row.DiagramNodeLabel))
        {
            return FourRealityAccessPosture.Unknown;
        }

        DiagramInfrastructureLabelProfile labelProfile = DiagramInfrastructureLabelParser.Parse(row.DiagramNodeLabel);

        if (labelProfile.ImpliesPrivateExposure)
        {
            return FourRealityAccessPosture.Private;
        }

        return FourRealityAccessPosture.Unknown;
    }

    public static bool IsDrift(
        FourRealityAccessPosture observed,
        FourRealityAccessPosture terraform,
        FourRealityAccessPosture diagram,
        FourRealityAccessPosture historical) =>
        observed == FourRealityAccessPosture.Public
        && (terraform == FourRealityAccessPosture.Private
            || diagram == FourRealityAccessPosture.Private
            || historical == FourRealityAccessPosture.Private);

    private static bool ObservedWideningChange(AzureInventoryChangeRecord change)
    {
        if (AzureInventoryDiffHeuristics.IsPublicExposureProperty(change.Property ?? string.Empty, change.NewValue))
        {
            return true;
        }

        if (change.ChangeType == AzureInventoryChangeType.NetworkExposureChanged
            && !string.IsNullOrWhiteSpace(change.OldValue)
            && !string.IsNullOrWhiteSpace(change.NewValue)
            && !string.Equals(change.OldValue, change.NewValue, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static FourRealityAccessPosture ParseDeclaredAccessValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return FourRealityAccessPosture.Unknown;
        }

        if (value.Equals("disabled", StringComparison.OrdinalIgnoreCase)
            || value.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            return FourRealityAccessPosture.Private;
        }

        if (value.Equals("enabled", StringComparison.OrdinalIgnoreCase)
            || value.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            return FourRealityAccessPosture.Public;
        }

        return FourRealityAccessPosture.Unknown;
    }
}
