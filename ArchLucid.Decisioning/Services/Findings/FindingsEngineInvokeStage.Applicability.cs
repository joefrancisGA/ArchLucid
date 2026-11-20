using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

partial class FindingsEngineInvokeStage
{
    private static EngineAdapter[] SelectApplicableAdapters(
        IReadOnlyList<EngineAdapter> adapters,
        FindingAnalysisContext? analysisContext)
    {
        return adapters
            .Where(adapter => CrossRunDiffFindingPriorGuard.ShouldInvoke(adapter.EngineType, analysisContext))
            .Where(adapter => ShouldInvokeInventorySecurityBaseline(adapter.EngineType, analysisContext))
            .ToArray();
    }

    private static bool ShouldInvokeInventorySecurityBaseline(
        string engineType,
        FindingAnalysisContext? analysisContext)
    {
        // Only a verified create-time commitment can distinguish intentionally absent inventory
        // from an uncommitted or damaged pin set. Unverified contexts retain fail-closed behavior.

        if (analysisContext is null || !analysisContext.HasCreateTimeEvidencePinCommitment)
        {
            return true;
        }

        // Provider names correspond to the create-time pin contract. Decisioning cannot depend on Application.
        (string Provider, HeldCheckInputCode InputCode)? inventory = engineType.ToLowerInvariant() switch
        {
            "azure-inventory-security-baseline" => ("azure-extractor", HeldCheckInputCode.AzureInventoryZip),
            "aws-inventory-security-baseline" => ("aws-extractor", HeldCheckInputCode.AwsInventoryZip),
            "gcp-inventory-security-baseline" => ("gcp-extractor", HeldCheckInputCode.GcpInventoryZip),
            _ => null,
        };

        if (inventory is null)
        {
            return true;
        }

        // Policy-mandated engines still execute and fail closed when their required pins are absent.

        if (analysisContext.RequiredEngineTypes.Any(
                required => string.Equals(required, engineType, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        string provider = inventory.Value.Provider;
        bool providerPinned = analysisContext.EvidencePins.Count > 0
            ? analysisContext.EvidencePins.Any(
                pin => string.Equals(pin.Provider, provider, StringComparison.OrdinalIgnoreCase))
            : analysisContext.EvidencePin is { } pin
              && string.Equals(pin.Provider, provider, StringComparison.OrdinalIgnoreCase);

        if (providerPinned)
        {
            // A present pin with missing CollectionUtc or invalid package remains an engine failure.
            return true;
        }

        // Not assessed, not a successful security scan. The held-check rollup is persisted with the snapshot.
        HeldCheckLedger.TryRecord(analysisContext, engineType, inventory.Value.InputCode);
        return false;
    }
}
