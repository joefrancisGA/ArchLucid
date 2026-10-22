using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Infrastructure.Canonical;

/// <summary>
///     Shared stable object identity helpers for infrastructure declaration canonical mappers.
/// </summary>
public static class CanonicalInfrastructureObjectMapper
{
    public static string BuildStableObjectId(
        string objectType,
        InfrastructureDeclarationReference declaration,
        string stableIdentity)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(objectType);
        ArgumentNullException.ThrowIfNull(declaration);
        ArgumentException.ThrowIfNullOrWhiteSpace(stableIdentity);

        return InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
            declaration.DeclarationId,
            objectType,
            stableIdentity);
    }

    public static string BuildOccurrenceAwareStableIdentity(
        string labelKey,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen,
        Dictionary<string, string> properties,
        string occurrencePropertyKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(labelKey);
        ArgumentNullException.ThrowIfNull(labelTotals);
        ArgumentNullException.ThrowIfNull(labelSeen);
        ArgumentNullException.ThrowIfNull(properties);
        ArgumentException.ThrowIfNullOrWhiteSpace(occurrencePropertyKey);

        int occurrence = labelSeen.GetValueOrDefault(labelKey) + 1;
        labelSeen[labelKey] = occurrence;

        string stableIdentity = labelTotals.TryGetValue(labelKey, out int total) && total > 1
            ? $"{labelKey}|occurrence:{occurrence}"
            : labelKey;

        if (labelTotals.TryGetValue(labelKey, out int duplicateTotal) && duplicateTotal > 1)
            properties[occurrencePropertyKey] = occurrence.ToString(System.Globalization.CultureInfo.InvariantCulture);

        return stableIdentity;
    }
}
