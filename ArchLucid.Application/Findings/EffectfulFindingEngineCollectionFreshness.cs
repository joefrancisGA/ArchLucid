using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Wave-11 suggestion 103: inventory freshness uses pinned <see cref="EvidencePackagePin.CollectionUtc" /> only.
/// </summary>
public static class EffectfulFindingEngineCollectionFreshness
{
    public static bool ShouldSuppressInventoryFindingsForAzure(
        FindingAnalysisContext? analysisContext,
        DateTime utcNow,
        int staleAfterDays) =>
        ShouldSuppressInventoryFindingsForProvider(
            analysisContext,
            RunEvidencePackagePinService.AzureProvider,
            utcNow,
            staleAfterDays);

    public static bool ShouldSuppressInventoryFindingsForCloud(
        FindingAnalysisContext? analysisContext,
        CloudProvider cloudProvider,
        DateTime utcNow,
        int staleAfterDays) =>
        ShouldSuppressInventoryFindingsForProvider(
            analysisContext,
            MapCloudProviderToPinProvider(cloudProvider),
            utcNow,
            staleAfterDays);

    public static DateTime ResolvePinnedCollectionUtcOrThrow(
        FindingAnalysisContext? analysisContext,
        CloudProvider cloudProvider) =>
        ResolvePinnedCollectionUtcOrThrow(analysisContext, MapCloudProviderToPinProvider(cloudProvider));

    public static bool TryGetPinnedCollectionUtc(
        FindingAnalysisContext? analysisContext,
        CloudProvider cloudProvider,
        out DateTime collectionUtc)
    {
        DateTime? resolved = ResolvePinnedCollectionUtc(
            analysisContext,
            MapCloudProviderToPinProvider(cloudProvider));

        if (resolved is null)
        {
            collectionUtc = default;
            return false;
        }

        collectionUtc = resolved.Value;
        return true;
    }

    private static bool ShouldSuppressInventoryFindingsForProvider(
        FindingAnalysisContext? analysisContext,
        string provider,
        DateTime utcNow,
        int staleAfterDays)
    {
        DateTime collectionUtc = ResolvePinnedCollectionUtcOrThrow(analysisContext, provider);

        return InventoryCollectionFreshnessGate.ShouldSuppressInventoryFindings(
            collectionUtc,
            utcNow,
            staleAfterDays);
    }

    private static DateTime ResolvePinnedCollectionUtcOrThrow(
        FindingAnalysisContext? analysisContext,
        string provider)
    {
        DateTime? collectionUtc = ResolvePinnedCollectionUtc(analysisContext, provider);

        if (collectionUtc is null)
        {
            throw new ConflictException(
                $"Effectful finding engine blocked: pinned evidence for '{provider}' has no CollectionUtc.");
        }

        return collectionUtc.Value;
    }

    private static DateTime? ResolvePinnedCollectionUtc(FindingAnalysisContext? analysisContext, string provider)
    {
        if (analysisContext?.EvidencePins is { Count: > 0 } pins)
        {
            EvidencePackagePin? match = pins.FirstOrDefault(pin =>
                string.Equals(pin.Provider, provider, StringComparison.OrdinalIgnoreCase));

            if (match?.CollectionUtc is not null)
                return match.CollectionUtc;
        }

        if (analysisContext?.EvidencePin is not null
            && string.Equals(analysisContext.EvidencePin.Provider, provider, StringComparison.OrdinalIgnoreCase))
        {
            return analysisContext.EvidencePin.CollectionUtc;
        }

        return null;
    }

    private static string MapCloudProviderToPinProvider(CloudProvider cloudProvider) =>
        cloudProvider switch
        {
            CloudProvider.Aws => RunEvidencePackagePinService.AwsProvider,
            CloudProvider.Gcp => RunEvidencePackagePinService.GcpProvider,
            _ => cloudProvider.ToString().ToLowerInvariant(),
        };
}
