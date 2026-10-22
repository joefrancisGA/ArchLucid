using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

/// <inheritdoc cref="IAuthorityFeasibilityVerdictComposer" />
public sealed partial class AuthorityFeasibilityVerdictComposer(FeasibilityVerdictBuilder verdictBuilder) : IAuthorityFeasibilityVerdictComposer
{
    private readonly FeasibilityVerdictBuilder _verdictBuilder =
        verdictBuilder ?? throw new ArgumentNullException(nameof(verdictBuilder));

    /// <inheritdoc />
    public FeasibilityVerdict Compose(
        ManifestDocument manifest,
        TransparencyTrail? intakeTransparencyTrail,
        FindingsSnapshot? findingsSnapshot = null,
        IReadOnlyList<string>? acceptedFindingIds = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        TransparencyTrail trail = CloneTrail(intakeTransparencyTrail) ?? new TransparencyTrail();
        EnrichTrailFromManifest(manifest, trail);

        List<string> unsatCoreKeys = CollectUnsatCoreInvariantKeys(manifest);

        if (IsFeasible(manifest, trail)
            && !FeasibilityFindingSeveritySignals.HasBlockingAcceptedSeverities(findingsSnapshot, acceptedFindingIds))
        {
            return _verdictBuilder.Feasible(
                "Authority pipeline resolved a satisfiable architecture within stated constraints.",
                trail);
        }

        if (IsFeasible(manifest, trail)
            && FeasibilityFindingSeveritySignals.HasBlockingAcceptedSeverities(findingsSnapshot, acceptedFindingIds))
        {
            IReadOnlyList<string> blockingFindingIds =
                FeasibilityFindingSeveritySignals.CollectBlockingAcceptedFindingIds(
                    findingsSnapshot,
                    acceptedFindingIds);

            foreach (string findingId in blockingFindingIds)
                UpsertInferred(trail, $"finding.blocking.{findingId}", $"Accepted finding {findingId} is Error or Critical.", 90);

            SoftInfeasibilityEnvelope severityEnvelope = new()
            {
                ConfidenceLow = 55,
                ConfidenceHigh = 90,
                EnvelopeDescription =
                    "Manifest structure resolved, but decision-grade findings include blocking Error or Critical severities.",
                SoftAssumption =
                    "Accepted findings accurately reflect deployment risk for this architecture snapshot.",
                CostOfBeingWrong =
                    "Treating the design as production-ready while blocking severities remain may ship unresolved architecture risk.",
            };

            return _verdictBuilder.SoftInfeasible(
                "Accepted findings include blocking Error or Critical severities.",
                trail,
                severityEnvelope,
                unsatCoreKeys,
                BuildProposedRelaxations(unsatCoreKeys));
        }

        string summary = BuildSoftSummary(manifest, trail);
        SoftInfeasibilityEnvelope envelope = BuildSoftEnvelope(manifest, trail);
        List<ProposedRelaxation> relaxations = BuildProposedRelaxations(unsatCoreKeys);

        return _verdictBuilder.SoftInfeasible(
            summary,
            trail,
            envelope,
            unsatCoreKeys,
            relaxations);
    }
}
