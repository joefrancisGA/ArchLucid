using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>Factory for well-formed <see cref="FeasibilityVerdict" /> instances (ADR 0050).</summary>
public sealed class FeasibilityVerdictBuilder
{
    private readonly IFeasibilityVerdictValidator _validator;

    public FeasibilityVerdictBuilder(IFeasibilityVerdictValidator validator)
    {
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }

    /// <summary>Admission redirect or other intake gap — soft by default (asymmetry rule).</summary>
    public FeasibilityVerdict FromIntakeRedirect(
        string redirectReason,
        TransparencyTrail transparencyTrail,
        string softAssumption)
    {
        ArgumentNullException.ThrowIfNull(transparencyTrail);

        if (string.IsNullOrWhiteSpace(redirectReason))
            throw new InvalidOperationException("Redirect reason is required.");

        if (string.IsNullOrWhiteSpace(softAssumption))
            throw new InvalidOperationException("Soft assumption is required.");

        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = redirectReason.Trim(),
            TransparencyTrail = transparencyTrail,
            SoftEnvelope = new SoftInfeasibilityEnvelope
            {
                ConfidenceLow = 40,
                ConfidenceHigh = 75,
                EnvelopeDescription =
                    "Intent is not yet designable within ArchLucid's admission gate; additional asserted input may change the verdict.",
                SoftAssumption = softAssumption.Trim(),
                CostOfBeingWrong =
                    "Proceeding without resolving the gap wastes operator time on an under-specified architecture run.",
            },
        };

        _validator.Validate(verdict);

        return verdict;
    }

    /// <summary>Successful admission or satisfiable design path.</summary>
    public FeasibilityVerdict Feasible(string summary, TransparencyTrail transparencyTrail)
    {
        ArgumentNullException.ThrowIfNull(transparencyTrail);

        if (string.IsNullOrWhiteSpace(summary))
            throw new InvalidOperationException("Summary is required.");

        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.Feasible,
            Summary = summary.Trim(),
            TransparencyTrail = transparencyTrail,
        };

        _validator.Validate(verdict);

        return verdict;
    }

    /// <summary>Provable contradiction or law — citation-gated.</summary>
    public FeasibilityVerdict HardInfeasible(
        string summary,
        TransparencyTrail transparencyTrail,
        IReadOnlyList<FeasibilityHardCitation> hardCitations,
        IReadOnlyList<string>? unsatCoreInvariantKeys = null,
        IReadOnlyList<ProposedRelaxation>? proposedRelaxations = null)
    {
        ArgumentNullException.ThrowIfNull(transparencyTrail);
        ArgumentNullException.ThrowIfNull(hardCitations);

        if (string.IsNullOrWhiteSpace(summary))
            throw new InvalidOperationException("Summary is required.");

        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = summary.Trim(),
            TransparencyTrail = transparencyTrail,
            Confidence = 100,
            HardCitations = hardCitations.ToList(),
            UnsatCoreInvariantKeys = unsatCoreInvariantKeys?.ToList() ?? [],
            ProposedRelaxations = proposedRelaxations?.ToList() ?? [],
        };

        _validator.Validate(verdict);

        return verdict;
    }

    /// <summary>Economic or empirical infeasibility with an explicit envelope.</summary>
    public FeasibilityVerdict SoftInfeasible(
        string summary,
        TransparencyTrail transparencyTrail,
        SoftInfeasibilityEnvelope softEnvelope,
        IReadOnlyList<string>? unsatCoreInvariantKeys = null,
        IReadOnlyList<ProposedRelaxation>? proposedRelaxations = null)
    {
        ArgumentNullException.ThrowIfNull(transparencyTrail);
        ArgumentNullException.ThrowIfNull(softEnvelope);

        if (string.IsNullOrWhiteSpace(summary))
            throw new InvalidOperationException("Summary is required.");

        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = summary.Trim(),
            TransparencyTrail = transparencyTrail,
            SoftEnvelope = softEnvelope,
            UnsatCoreInvariantKeys = unsatCoreInvariantKeys?.ToList() ?? [],
            ProposedRelaxations = proposedRelaxations?.ToList() ?? [],
        };

        _validator.Validate(verdict);

        return verdict;
    }
}
