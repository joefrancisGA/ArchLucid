using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Typed feasibility outcome with mandatory transparency trail (ADR 0050).
/// </summary>
/// <remarks>
///     <see cref="FeasibilityVerdictKind.HardInfeasible" /> requires at least one
///     <see cref="HardCitations" /> entry and <see cref="Confidence" /> fixed at 100.
///     <see cref="FeasibilityVerdictKind.SoftInfeasible" /> requires a populated
///     <see cref="SoftEnvelope" />. Validation is enforced by
///     <c>IFeasibilityVerdictValidator</c> in Decisioning.
/// </remarks>
public sealed class FeasibilityVerdict
{
    [JsonPropertyName("kind")]
    public FeasibilityVerdictKind Kind
    {
        get;
        set;
    }

    /// <summary>Operator-facing summary of the verdict.</summary>
    [JsonPropertyName("summary")]
    public string Summary
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Mandatory provenance record (ADR 0050 / R4) — absence is a defect.</summary>
    private TransparencyTrail transparencyTrail = new();

    [JsonPropertyName("transparencyTrail")]
    public TransparencyTrail TransparencyTrail
    {
        get => transparencyTrail;
        set => transparencyTrail = value ?? new TransparencyTrail();
    }

    /// <summary>
    ///     Fixed at 100 for <see cref="FeasibilityVerdictKind.HardInfeasible" />; optional for other kinds.
    /// </summary>
    [JsonPropertyName("confidence")]
    public int? Confidence
    {
        get;
        set;
    }

    /// <summary>Authority references — required and non-empty only for hard infeasibility.</summary>
    private List<FeasibilityHardCitation> hardCitations = [];

    [JsonPropertyName("hardCitations")]
    public List<FeasibilityHardCitation> HardCitations
    {
        get => hardCitations;
        set => hardCitations = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Operating envelope — required only for soft infeasibility.</summary>
    [JsonPropertyName("softEnvelope")]
    public SoftInfeasibilityEnvelope? SoftEnvelope
    {
        get;
        set;
    }

    /// <summary>
    ///     Minimal conflicting <c>INV-*</c> set when the design is over-constrained (unsat core).
    /// </summary>
    private List<string> unsatCoreInvariantKeys = [];

    [JsonPropertyName("unsatCoreInvariantKeys")]
    public List<string> UnsatCoreInvariantKeys
    {
        get => unsatCoreInvariantKeys;
        set => unsatCoreInvariantKeys = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Trade-offs ArchLucid surfaces; the operator must explicitly accept any relaxation.</summary>
    private List<ProposedRelaxation> proposedRelaxations = [];

    [JsonPropertyName("proposedRelaxations")]
    public List<ProposedRelaxation> ProposedRelaxations
    {
        get => proposedRelaxations;
        set => proposedRelaxations = ContractCollectionDefaults.Coalesce(value);
    }
}
