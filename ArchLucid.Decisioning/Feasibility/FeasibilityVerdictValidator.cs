using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Feasibility;

/// <inheritdoc cref="IFeasibilityVerdictValidator" />
public sealed class FeasibilityVerdictValidator : IFeasibilityVerdictValidator
{
    private const int HardInfeasibleConfidence = 100;

    private const int MinimumInvariantContradictionKeys = 2;

    /// <inheritdoc />
    public void Validate(FeasibilityVerdict verdict)
    {
        ArgumentNullException.ThrowIfNull(verdict);

        if (string.IsNullOrWhiteSpace(verdict.Summary))
            throw new InvalidOperationException("Feasibility verdict summary is required.");

        TransparencyTrail trail = verdict.TransparencyTrail
            ?? throw new InvalidOperationException("Feasibility verdict must include a transparency trail.");

        if (!trail.HasValidInferredConfidences)
            throw new InvalidOperationException(
                "Transparency trail inferred entries must have confidence in the 1–100 range.");

        ValidateUnsatCore(verdict.UnsatCoreInvariantKeys);
        ValidateProposedRelaxations(verdict.ProposedRelaxations);

        switch (verdict.Kind)
        {
            case FeasibilityVerdictKind.Feasible:
                ValidateFeasible(verdict);
                break;

            case FeasibilityVerdictKind.SoftInfeasible:
                ValidateSoftInfeasible(verdict);
                break;

            case FeasibilityVerdictKind.HardInfeasible:
                ValidateHardInfeasible(verdict);
                break;

            default:
                throw new InvalidOperationException($"Unknown feasibility verdict kind '{verdict.Kind}'.");
        }
    }

    private static void ValidateFeasible(FeasibilityVerdict verdict)
    {
        if (verdict.HardCitations.Count > 0)
            throw new InvalidOperationException("Feasible verdicts must not carry hard citations.");

        if (verdict.SoftEnvelope is not null)
            throw new InvalidOperationException("Feasible verdicts must not carry a soft envelope.");

        if (verdict.Confidence == HardInfeasibleConfidence)
            throw new InvalidOperationException(
                "Feasible verdicts must not use hard-infeasibility confidence (100).");
    }

    private static void ValidateSoftInfeasible(FeasibilityVerdict verdict)
    {
        if (verdict.HardCitations.Count > 0)
            throw new InvalidOperationException(
                "SoftInfeasible verdicts must not carry hard citations — use HardInfeasible when a law applies.");

        SoftInfeasibilityEnvelope envelope = verdict.SoftEnvelope
            ?? throw new InvalidOperationException("SoftInfeasible verdicts require a soft envelope.");

        if (string.IsNullOrWhiteSpace(envelope.EnvelopeDescription))
            throw new InvalidOperationException("Soft envelope description is required.");

        if (string.IsNullOrWhiteSpace(envelope.SoftAssumption))
            throw new InvalidOperationException("Soft assumption is required.");

        if (string.IsNullOrWhiteSpace(envelope.CostOfBeingWrong))
            throw new InvalidOperationException("Cost of being wrong is required for soft infeasibility.");

        if (envelope.ConfidenceLow is < 1 or > 100 || envelope.ConfidenceHigh is < 1 or > 100)
            throw new InvalidOperationException("Soft envelope confidence band must be in the 1–100 range.");

        if (envelope.ConfidenceLow > envelope.ConfidenceHigh)
            throw new InvalidOperationException("Soft envelope confidenceLow must not exceed confidenceHigh.");

        if (verdict.Confidence == HardInfeasibleConfidence)
            throw new InvalidOperationException(
                "SoftInfeasible verdicts must not use hard-infeasibility confidence (100).");
    }

    private static void ValidateHardInfeasible(FeasibilityVerdict verdict)
    {
        if (verdict.SoftEnvelope is not null)
            throw new InvalidOperationException("HardInfeasible verdicts must not carry a soft envelope.");

        if (verdict.Confidence != HardInfeasibleConfidence)
            throw new InvalidOperationException(
                $"HardInfeasible verdicts require confidence {HardInfeasibleConfidence}.");

        if (verdict.HardCitations.Count == 0)
            throw new InvalidOperationException(
                "HardInfeasible verdicts require at least one citation (law, theorem, or invariant contradiction).");

        foreach (FeasibilityHardCitation citation in verdict.HardCitations)
            ValidateHardCitation(citation);
    }

    private static void ValidateHardCitation(FeasibilityHardCitation citation)
    {
        ArgumentNullException.ThrowIfNull(citation);

        if (string.IsNullOrWhiteSpace(citation.Reference))
            throw new InvalidOperationException("Hard citation reference is required.");

        if (citation.Kind == FeasibilityCitationKind.InvariantContradiction)
        {
            if (citation.InvariantKeys.Count < MinimumInvariantContradictionKeys)
            {
                throw new InvalidOperationException(
                    $"Invariant contradiction citations require at least {MinimumInvariantContradictionKeys} INV-* keys.");
            }

            foreach (string invariantKey in citation.InvariantKeys)
            {
                if (!FeasibilityInvariantCatalog.IsValidInvariantKey(invariantKey))
                {
                    throw new InvalidOperationException(
                        $"Hard citation invariant key '{invariantKey}' is not a valid INV-* catalog id.");
                }
            }

            return;
        }

        if (citation.InvariantKeys.Count > 0)
        {
            throw new InvalidOperationException(
                "Invariant keys are only permitted on InvariantContradiction citations.");
        }
    }

    private static void ValidateUnsatCore(IReadOnlyList<string> unsatCoreInvariantKeys)
    {
        foreach (string invariantKey in unsatCoreInvariantKeys)
        {
            if (!FeasibilityInvariantCatalog.IsValidInvariantKey(invariantKey))
            {
                throw new InvalidOperationException(
                    $"Unsat core invariant key '{invariantKey}' is not a valid INV-* catalog id.");
            }
        }
    }

    private static void ValidateProposedRelaxations(IReadOnlyList<ProposedRelaxation> proposedRelaxations)
    {
        foreach (ProposedRelaxation relaxation in proposedRelaxations)
        {
            ArgumentNullException.ThrowIfNull(relaxation);

            if (!FeasibilityInvariantCatalog.IsValidInvariantKey(relaxation.InvariantKey))
            {
                throw new InvalidOperationException(
                    $"Proposed relaxation invariant key '{relaxation.InvariantKey}' is not a valid INV-* catalog id.");
            }

            if (string.IsNullOrWhiteSpace(relaxation.TradeOffDescription))
                throw new InvalidOperationException("Proposed relaxation trade-off description is required.");
        }
    }
}
