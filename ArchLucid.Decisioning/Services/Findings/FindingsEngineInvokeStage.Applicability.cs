using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

partial class FindingsEngineInvokeStage
{
    private static EngineAdapter[] SelectApplicableAdapters(
        IReadOnlyList<EngineAdapter> adapters,
        FindingAnalysisContext? analysisContext)
    {
        return adapters
            .Where(adapter => CrossRunDiffFindingPriorGuard.ShouldInvoke(adapter.EngineType, analysisContext)
                              && ShouldInvokeInventorySecurityBaseline(adapter.EngineType, analysisContext))
            .ToArray();
    }

    /// <summary>
    ///     Inventory baselines cannot measure an unprovided provider ZIP. Record it as NOT ASSESSED,
    ///     not a successful empty scan; never hide required engines, corrupt pin commitments,
    ///     or existing pins with missing collection timestamps.
    /// </summary>
    private static bool ShouldInvokeInventorySecurityBaseline(
        string engineType,
        FindingAnalysisContext? analysisContext)
    {
        (string provider, HeldCheckInputCode code) = engineType.ToLowerInvariant() switch
        {
            "azure-inventory-security-baseline" => ("azure-extractor", HeldCheckInputCode.AzureInventoryZip),
            "aws-inventory-security-baseline" => ("aws-extractor", HeldCheckInputCode.AwsInventoryZip),
            "gcp-inventory-security-baseline" => ("gcp-extractor", HeldCheckInputCode.GcpInventoryZip),
            _ => (string.Empty, default),
        };

        if (provider.Length == 0 || analysisContext is null)
            return true;

        bool anyPins = analysisContext.EvidencePin is not null || analysisContext.EvidencePins.Count > 0;
        bool matchingPin = string.Equals(analysisContext.EvidencePin?.Provider, provider,
                               StringComparison.OrdinalIgnoreCase)
                           || analysisContext.EvidencePins.Any(pin =>
                               string.Equals(pin.Provider, provider, StringComparison.OrdinalIgnoreCase));
        bool required = analysisContext.RequiredEngineTypes.Contains(engineType, StringComparer.OrdinalIgnoreCase);

        // A matching pin must be assessed even if it lacks CollectionUtc, to preserve fail-closed handling.
        // The same applies when a policy mandates the engine or evidence-pin commitment is inconsistent.
        if (matchingPin || required
            || (analysisContext.HasCreateTimeEvidencePinCommitment && !anyPins)
            || (anyPins && !analysisContext.HasCreateTimeEvidencePinCommitment))
            return true;

        analysisContext.HeldCheckLedger?.Record(engineType, code);
        return false;
    }
}
