using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Llm;

/// <summary>Site-independent signal from a deterministic, scoped check of a single claim.</summary>
public enum IndependentProviderClaimOutcome
{
    Unknown,
    Supported,
    Contradicted,
}

/// <summary>One observation of a response whose actual provider and version are available.</summary>
public interface IIndependentProviderQualitySample
{
    /// <summary>The response is a synthetic recovery artifact and must not be used as customer analysis.</summary>
    bool IsSyntheticRecovery => false;

    Task RecordAsync(
        ScopeContext scope, Guid storedExplanationId, IndependentProviderClaimOutcome outcome, bool material,
        InventoryFalsificationProbe? inventoryFalsification, CancellationToken cancellationToken);
}

/// <summary>Captures trusted attribution within the normal completion path, without issuing an extra call.</summary>
public interface IIndependentProviderQualityObserver
{
    Task<(string Response, IIndependentProviderQualitySample? Sample)> ObserveAsync(
        Func<CancellationToken, Task<string>> complete, CancellationToken cancellationToken);
}
