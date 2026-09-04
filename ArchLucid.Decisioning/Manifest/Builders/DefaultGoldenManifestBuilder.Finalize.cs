using ArchLucid.Core.Manifest;

namespace ArchLucid.Decisioning.Manifest.Builders;

public partial class DefaultGoldenManifestBuilder
{
    private static void NormalizeManifestOrdering(ManifestDocument manifest)
    {
        manifest.Requirements.Covered = manifest.Requirements.Covered
            .OrderBy(x => x.RequirementName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Requirements.Uncovered = manifest.Requirements.Uncovered
            .OrderBy(x => x.RequirementName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Topology.SelectedPatterns = manifest.Topology.SelectedPatterns
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Topology.Resources = manifest.Topology.Resources
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Topology.Services = manifest.Topology.Services
            .OrderBy(x => x.ServiceName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Topology.Datastores = manifest.Topology.Datastores
            .OrderBy(x => x.DatastoreName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Topology.Gaps = manifest.Topology.Gaps
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Security.Controls = manifest.Security.Controls
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Security.Gaps = manifest.Security.Gaps
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Compliance.Controls = manifest.Compliance.Controls
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Compliance.Gaps = manifest.Compliance.Gaps
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Cost.CostRisks = manifest.Cost.CostRisks
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Cost.Notes = manifest.Cost.Notes
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.UnresolvedIssues.Items = manifest.UnresolvedIssues.Items
            .OrderBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Decisions = manifest.Decisions
            .OrderBy(x => x.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Assumptions = manifest.Assumptions
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Warnings = manifest.Warnings
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Constraints.MandatoryConstraints = manifest.Constraints.MandatoryConstraints
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Constraints.Preferences = manifest.Constraints.Preferences
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Provenance.SourceFindingIds = manifest.Provenance.SourceFindingIds
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Provenance.SourceGraphNodeIds = manifest.Provenance.SourceGraphNodeIds
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Provenance.AppliedRuleIds = manifest.Provenance.AppliedRuleIds
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Policy.SatisfiedControls = manifest.Policy.SatisfiedControls
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Policy.Violations = manifest.Policy.Violations
            .OrderBy(x => x.ControlName, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Policy.Exemptions = manifest.Policy.Exemptions
            .OrderBy(x => x.ControlId, StringComparer.OrdinalIgnoreCase)
            .ToList();
        manifest.Policy.Notes = manifest.Policy.Notes
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
