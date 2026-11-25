using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class FourRealityResourceAccessReader
{
    public static IReadOnlyDictionary<string, string> BuildPropertyBag(
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties,
        Guid resourceRowId)
    {
        ArgumentNullException.ThrowIfNull(properties);

        Dictionary<string, string> bag = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (property.ResourceRowId != resourceRowId)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(property.PropertyKey) || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            bag[property.PropertyKey] = property.PropertyValue.Trim();
        }

        return bag;
    }

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

        return BuildPropertyBag(snapshot.Properties, resource.ResourceRowId);
    }

    public static FourRealityAccessPosture ReadObservedPosture(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        // Public access configuration and endpoint approval are independent observations.
        // A private endpoint record alone does not establish network isolation.
        return AzureInventoryPublicNetworkAccessResolver.ResolvePublicAccess(properties) switch
        {
            AzureInventoryPublicNetworkAccessResolver.ObservedPublicAccess.Enabled => FourRealityAccessPosture.Public,
            AzureInventoryPublicNetworkAccessResolver.ObservedPublicAccess.Disabled => FourRealityAccessPosture.Private,
            _ => FourRealityAccessPosture.Unknown,
        };
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
