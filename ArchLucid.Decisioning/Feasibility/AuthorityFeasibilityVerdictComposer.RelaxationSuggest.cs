using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

public sealed partial class AuthorityFeasibilityVerdictComposer
{
    private static List<ProposedRelaxation> BuildProposedRelaxations(IReadOnlyList<string> unsatCoreKeys)
    {
        List<ProposedRelaxation> relaxations = [];

        foreach (string invariantKey in unsatCoreKeys)
        {
            relaxations.Add(
                new ProposedRelaxation
                {
                    InvariantKey = invariantKey,
                    TradeOffDescription =
                        $"Relax or re-scope invariant {invariantKey}; ArchLucid proposes the trade-off but does not apply it silently.",
                });
        }

        return relaxations;
    }

    private static List<string> CollectUnsatCoreInvariantKeys(ManifestDocument manifest)
    {
        List<string> segments =
        [
            .. manifest.Policy.Violations.Select(static violation => violation.Description),
            .. manifest.Policy.Violations.Select(static violation => violation.ControlName),
            .. manifest.Policy.Notes,
            .. manifest.UnresolvedIssues.Items.Select(static issue => issue.Description),
            .. manifest.UnresolvedIssues.Items.Select(static issue => issue.Title),
            .. manifest.Requirements.Uncovered
                .Where(static item => item.IsMandatory)
                .Select(static item => item.RequirementText),
        ];

        return AuthorityInvariantKeyExtractor.ExtractDistinctInvariantKeys(segments.ToArray());
    }
}
