using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

using Cm = ArchLucid.Contracts.Manifest;
using DmSec = ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Manifest;

/// <inheritdoc cref="IAuthorityCommitProjectionBuilder" />
public sealed class AuthorityCommitProjectionBuilder : IAuthorityCommitProjectionBuilder
{
    public Task<Cm.GoldenManifest> BuildAsync(
        ManifestDocument source,
        AuthorityCommitProjectionInput input,
        CancellationToken cancellationToken = default)
    {
        if (source is null)
            throw new ArgumentNullException(nameof(source));

        if (input is null)
            throw new ArgumentNullException(nameof(input));

        if (string.IsNullOrWhiteSpace(input.SystemName))
            throw new ArgumentException("SystemName is required for coordinator-shaped projection.", nameof(input));

        cancellationToken.ThrowIfCancellationRequested();

        Cm.GoldenManifest result = new()
        {
            RunId = source.RunId.ToString("N"),
            SystemName = input.SystemName,
            Services = [.. source.Topology.Services],
            Datastores = [.. source.Topology.Datastores],
            Relationships = [.. source.Topology.Relationships],
            Governance = MapGovernance(source),
            Metadata = MapMetadata(source),
            DiagramSemantics = MapDiagramSemantics(source, input),
        };
        return Task.FromResult(result);
    }

    private static Cm.ManifestGovernance MapGovernance(ManifestDocument source)
    {
        List<string> complianceTags = source.Compliance.Controls
            .Select(c => c.ControlName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> policyConstraints = source.Policy.Violations
            .Select(v => v.ControlName)
            .Concat(source.Policy.Notes)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> required = source.Security.Controls
            .Where(c => !string.Equals(c.Status, "missing", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.ControlName)
            .Concat(source.Policy.SatisfiedControls.Select(s => s.ControlName))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        string risk = "Moderate";

        if (source.Cost.CostRisks.Count > 0)
            risk = "High";

        if (source.UnresolvedIssues.Items.Count == 0 && source.Cost.CostRisks.Count == 0)
            risk = "Low";

        string costTier = source.Cost.MaxMonthlyCost is > 10000m ? "High" : "Moderate";

        return new Cm.ManifestGovernance
        {
            ComplianceTags = complianceTags,
            PolicyConstraints = policyConstraints,
            RequiredControls = required,
            RiskClassification = risk,
            CostClassification = costTier
        };
    }

    private static Cm.ManifestMetadata MapMetadata(ManifestDocument source)
    {
        DmSec.ManifestMetadata meta = source.Metadata;

        return new Cm.ManifestMetadata
        {
            ManifestVersion = AuthorityCommitManifestVersionRules.ResolveContractManifestVersion(meta),
            ParentManifestVersion = null,
            ChangeDescription = meta.Summary,
            DecisionTraceIds = [source.DecisionTraceId.ToString("N")],
            CreatedUtc = source.CreatedUtc
        };
    }

    private static Cm.ManifestDiagramSemanticOverlay MapDiagramSemantics(
        ManifestDocument source,
        AuthorityCommitProjectionInput input)
    {
        Cm.ManifestDiagramSemanticOverlay overlay = new()
        {
            Actors = [.. input.DraftActors],
        };

        HashSet<string> trustBoundaryLabels = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> requirementLabels = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> decisionLabels = new(StringComparer.OrdinalIgnoreCase);

        foreach (ActorDescriptor actor in input.DraftActors)
        {
            if (actor.TrustOrigin is TrustOrigin.External or TrustOrigin.PublicAnonymous)
            {
                string label = string.IsNullOrWhiteSpace(actor.Label) ? actor.Kind.ToString() : actor.Label!.Trim();
                trustBoundaryLabels.Add($"{label} ({actor.TrustOrigin})");
            }
        }

        foreach (DmSec.SecurityPostureItem control in source.Security.Controls)
        {
            if (string.IsNullOrWhiteSpace(control.ControlName))
                continue;

            if (control.ControlName.Contains("trust", StringComparison.OrdinalIgnoreCase)
                || control.ControlName.Contains("boundary", StringComparison.OrdinalIgnoreCase))
            {
                trustBoundaryLabels.Add(control.ControlName.Trim());
            }
        }

        foreach (string constraint in source.Constraints.MandatoryConstraints)
        {
            AppendConfirmedLabel(requirementLabels, constraint);
        }

        foreach (DmSec.RequirementCoverageItem requirement in source.Requirements.Covered)
        {
            AppendConfirmedLabel(requirementLabels, FormatRequirementCoverageItem(requirement));
        }

        foreach (DmSec.RequirementCoverageItem requirement in source.Requirements.Uncovered)
        {
            AppendConfirmedLabel(requirementLabels, FormatRequirementCoverageItem(requirement));
        }

        foreach (ResolvedArchitectureDecision decision in source.Decisions)
        {
            string synopsis = ManifestDecisionSynopsisFormatter.FormatSynopsis(decision);

            if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(synopsis))
                decisionLabels.Add(synopsis.Trim());
        }

        overlay.TrustBoundaryLabels = trustBoundaryLabels.ToList();
        overlay.RequirementLabels = requirementLabels.ToList();
        overlay.DecisionLabels = decisionLabels.ToList();
        return overlay;
    }

    private static string FormatRequirementCoverageItem(DmSec.RequirementCoverageItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.RequirementText))
            return item.RequirementText.Trim();

        return item.RequirementName.Trim();
    }

    private static void AppendConfirmedLabel(HashSet<string> target, string? value)
    {
        if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(value))
            return;

        target.Add(value!.Trim());
    }
}

