using System.Globalization;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest topology from graph snapshots and topology-gap findings.</summary>
public sealed class TopologyManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Topology";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.TopologyGap))
        {
            TopologyGapFindingPayload? payload = FindingPayloadConverter.ToTopologyGapPayload(finding);

            string description = payload?.Description ?? finding.Title;
            manifest.Topology.Gaps.Add(description);
            manifest.Warnings.Add(description);

            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = "TopologyGap",
                Title = finding.Title,
                Description = payload?.Impact ?? finding.Rationale,
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId]
            });
        }
    }

    public void PopulateFromGraph(ManifestDocument manifest, GraphSnapshot graphSnapshot)
    {
        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(node.Label))
                continue;

            manifest.Topology.Resources.Add(node.Label);

            string? category = node.Category;
            bool isDatastore = string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                               || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase);

            if (isDatastore)
            {
                manifest.Topology.Datastores.Add(
                    new Cm.ManifestDatastore
                    {
                        DatastoreId = node.NodeId,
                        DatastoreName = node.Label,
                        DatastoreType = ParseEnumKey<DatastoreType>(node.Properties, "datastoreType"),
                        RuntimePlatform = ParseEnumKey<RuntimePlatform>(node.Properties, "runtimePlatform")
                    });

                continue;
            }

            manifest.Topology.Services.Add(
                new Cm.ManifestService
                {
                    ServiceId = node.NodeId,
                    ServiceName = node.Label,
                    ServiceType = ParseEnumKey<ServiceType>(node.Properties, "serviceType"),
                    RuntimePlatform = ParseEnumKey<RuntimePlatform>(node.Properties, "runtimePlatform")
                });
        }
    }

    private static TEnum ParseEnumKey<TEnum>(Dictionary<string, string> properties, string key)
        where TEnum : struct, Enum
    {
        if (string.IsNullOrEmpty(key))
            return default;

        string? raw = null;

        foreach (KeyValuePair<string, string> kv in properties)
        {
            if (!string.Equals(kv.Key, key, StringComparison.OrdinalIgnoreCase))
                continue;

            raw = kv.Value;
            break;
        }

        if (string.IsNullOrWhiteSpace(raw))
            return default;

        return Enum.TryParse(raw, true, out TEnum e) ? e : default;
    }
}

/// <summary>Populates manifest security controls and gaps from security findings.</summary>
public sealed class SecurityManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Security";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.SecurityControlFinding))
        {
            SecurityControlFindingPayload? payload = FindingPayloadConverter.ToSecurityControlPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, SectionName);
                continue;
            }

            manifest.Security.Controls.Add(new SecurityPostureItem
            {
                ControlId = payload.ControlId,
                ControlName = payload.ControlName,
                Status = payload.Status,
                Impact = payload.Impact
            });

            if (!string.Equals(payload.Status, "missing", StringComparison.OrdinalIgnoreCase))
                continue;

            manifest.Security.Gaps.Add($"{payload.ControlName} is missing");
            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = "SecurityGap",
                Title = $"Missing security control: {payload.ControlName}",
                Description = payload.Impact,
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId]
            });

            ResolvedArchitectureDecision securityDecision = new()
            {
                Category = "Security",
                Title = $"Enforce control: {payload.ControlName}",
                SelectedOption = "RequiredRemediation",
                Rationale = payload.Impact,
                SupportingFindingIds = [finding.FindingId]
            };
            ManifestDecisionConfidenceProjector.ApplyTo(securityDecision, finding);
            manifest.Decisions.Add(securityDecision);
        }
    }
}

/// <summary>Populates manifest cost constraints and budget assumptions.</summary>
public sealed class CostManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Cost";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.CostConstraintFinding))
        {
            CostConstraintFindingPayload? payload = FindingPayloadConverter.ToCostConstraintPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, SectionName);
                continue;
            }

            if (payload.MaxMonthlyCost.HasValue)
                manifest.Cost.MaxMonthlyCost = payload.MaxMonthlyCost.Value;

            if (!string.IsNullOrWhiteSpace(payload.CostRisk))
                manifest.Cost.CostRisks.Add(payload.CostRisk);

            string budgetLabel = string.IsNullOrWhiteSpace(payload.BudgetName) ? "default" : payload.BudgetName;
            string capText = payload.MaxMonthlyCost.HasValue
                ? payload.MaxMonthlyCost.Value.ToString("N0", CultureInfo.InvariantCulture)
                : "unspecified";

            manifest.Assumptions.Add(
                $"Preferred: Cost targets align with budget '{budgetLabel}' (monthly cap {capText}, risk {payload.CostRisk}).");
        }
    }
}
