using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.InfraEvidence;

using Xunit.Abstractions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingCorrelationReadOnlyCohortTests(ITestOutputHelper output)
{
    private const string AssetPrefix =
        "/subscriptions/33333333-3333-3333-3333-333333333333/resourceGroups/rg-fixture/providers/Microsoft.Storage/storageAccounts/";

    [Fact]
    public async Task DeclarationFindingCohort_SeparatesAssetsAndScopesWithoutGuessingMissingBindings()
    {
        InMemoryCloudResourceIdentityDirectory directory = new();
        ScopeContext project = NewScope();
        ScopeContext otherProject = NewScope(project.TenantId, project.WorkspaceId);
        ScopeContext otherWorkspace = NewScope(project.TenantId);
        ScopeContext otherTenant = NewScope();
        string originalId = AssetPrefix + "stfixture1";
        CloudResourceIdentityRecord original = await SeedAsync(directory, project, originalId);
        CloudResourceIdentityRecord reobserved = await SeedAsync(directory, project, originalId);
        CloudResourceIdentityRecord peer = await SeedAsync(directory, project, AssetPrefix + "stfixture2");
        CloudResourceIdentityRecord projectPeer = await SeedAsync(directory, otherProject, AssetPrefix + "stfixture3");
        CloudResourceIdentityRecord workspacePeer = await SeedAsync(directory, otherWorkspace, AssetPrefix + "stfixture4");
        CloudResourceIdentityRecord tenantPeer = await SeedAsync(directory, otherTenant, originalId);

        Assert.Equal(original.CloudResourceId, reobserved.CloudResourceId);
        Assert.NotEqual(original.LastSeenSnapshotId, reobserved.LastSeenSnapshotId);

        // Comparison below only reads the directory. The graphs are local and each non-control
        // finding is emitted by the same production policy engine. No V2 key drives a match.
        Probe originalFinding = await ObserveAsync(directory, project, originalId, original.CloudResourceId);

        (string Label, Probe Candidate, bool V1, bool? V2)[] pairs =
        [
            ("same asset, new observation",
                await ObserveAsync(directory, project, originalId, reobserved.CloudResourceId), true, true),
            ("different asset in the same project",
                await ObserveAsync(directory, project, peer.ExternalResourceIdNormalized, peer.CloudResourceId), true, false),
            ("different project",
                await ObserveAsync(directory, otherProject, projectPeer.ExternalResourceIdNormalized, projectPeer.CloudResourceId), true, false),
            ("different workspace",
                await ObserveAsync(directory, otherWorkspace, workspacePeer.ExternalResourceIdNormalized, workspacePeer.CloudResourceId), true, false),
            ("same provider ID in a different tenant",
                await ObserveAsync(directory, otherTenant, originalId, tenantPeer.CloudResourceId), true, false),
            ("changed finding text",
                await ObserveAsync(directory, project, originalId, original.CloudResourceId, nodeLabel: "changed label"), false, false),
            ("missing directory binding",
                await ObserveAsync(directory, project, originalId, null), true, null),
            ("directory row outside the requested scope",
                await ObserveAsync(directory, project, projectPeer.ExternalResourceIdNormalized, projectPeer.CloudResourceId), true, null),
            ("same finding cited against two assets",
                await ObserveAsync(directory, project, originalId, original.CloudResourceId, secondAssetId: peer.ExternalResourceIdNormalized), true, null),
            ("citation does not match the linked graph node",
                await ObserveAsync(directory, project, originalId, original.CloudResourceId, citationId: peer.ExternalResourceIdNormalized), true, null),
            ("finding has no policy key",
                await ObserveAsync(directory, project, originalId, original.CloudResourceId, policyRule: "cost-opt-001"), false, null),
        ];

        Assert.NotNull(originalFinding.V2);
        int v1Matches = 0, v2Matches = 0, v2Distinct = 0, unavailable = 0, separated = 0;

        foreach (var pair in pairs)
        {
            bool v1Match = string.Equals(originalFinding.V1, pair.Candidate.V1, StringComparison.Ordinal);
            bool? v2Match = pair.Candidate.V2 is not null
                ? string.Equals(originalFinding.V2, pair.Candidate.V2, StringComparison.Ordinal)
                : null;
            Assert.True(v1Match == pair.V1 && v2Match == pair.V2,
                $"{pair.Label}: V1={v1Match}, V2={v2Match?.ToString() ?? "unavailable"}");

            v1Matches += v1Match ? 1 : 0;
            v2Matches += v2Match == true ? 1 : 0;
            v2Distinct += v2Match == false ? 1 : 0;
            unavailable += v2Match is null ? 1 : 0;
            separated += v1Match && v2Match == false ? 1 : 0;
            output.WriteLine("{0}: V1={1}, V2={2}", pair.Label, v1Match, v2Match?.ToString() ?? "unavailable");
        }

        Assert.Equal((9, 1, 5, 5, 4), (v1Matches, v2Matches, v2Distinct, unavailable, separated));
        output.WriteLine("Cohort: {0} pairs, V1 matched {1}, V2 matched {2}, distinct {3}, unavailable {4}, V1 matches separated {5}.",
            pairs.Length, v1Matches, v2Matches, v2Distinct, unavailable, separated);
    }

    private static async Task<Probe> ObserveAsync(
        ICloudResourceIdentityDirectory directory,
        ScopeContext scope,
        string sourceId,
        Guid? cloudResourceId,
        string? secondAssetId = null,
        string? citationId = null,
        string nodeLabel = "fixture storage",
        string policyRule = "cis-az-009")
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "storage",
                    NodeType = "TopologyResource",
                    Label = nodeLabel,
                    SourceId = sourceId,
                    Properties = new()
                    {
                        ["tf.public_network_access"] = "enabled",
                        ["armResourceId"] = citationId ?? sourceId,
                    },
                },
            ],
        };
        DeclarationSecurityBaselineFindingEngine engine = new(new FixtureRulePack(policyRule));
        Finding finding = Assert.Single(await engine.AnalyzeAsync(graph, null, CancellationToken.None));

        if (secondAssetId is not null)
        {
            // Model a finding with two related nodes. Neither asset can be picked by order.
            graph.Nodes.Add(new GraphNode { NodeId = "second", SourceId = secondAssetId });
            finding.RelatedNodeIds.Add("second");
            finding.EvidenceRefs.Add(secondAssetId);
        }

        ProjectScopeKey project = ProjectScopeKey.From(scope);
        string? assetKey = null;

        if (cloudResourceId is Guid id && finding.RelatedNodeIds is [string nodeId])
        {
            string? linkedSourceId = Assert.Single(graph.Nodes, node => node.NodeId == nodeId).SourceId;

            // This fixture treats the selected graph SourceId, engine citation, and the exact-scope
            // directory row as independent evidence. Labels, prose, and tenant-only reads are excluded.

            if (linkedSourceId is not null && finding.EvidenceRefs.Contains(linkedSourceId, StringComparer.Ordinal))
            {
                CloudResourceIdentityRecord? row =
                    await directory.TryGetByCloudResourceIdInScopeAsync(scope, id);

                if (row?.ExternalResourceIdNormalized == ArmResourceIdNormalizer.Normalize(linkedSourceId))
                    assetKey = FindingCorrelationAssetKey.TryFromCloudResource(project, row);
            }
        }

        string findingId = finding.FindingId;
        string legacy = FindingSnapshotMergeKey.FromFinding(finding);
        string? canonical = FindingSnapshotMergeKey.TryRebuildCanonicalKeyFromLegacy(finding, project, assetKey, legacy);

        // Project the very same source finding into the review DTO and compare the two adapters.
        ArchitectureFinding review = new()
        {
            FindingId = findingId,
            PolicyRuleId = finding.PolicyRuleId,
            Category = finding.Category,
            Message = finding.Title,
        };
        string? reviewLegacy = NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(review);
        Assert.Equal(canonical, NormalizedFindingFingerprintNormalizer.TryRebuildCanonicalKeyFromLegacy(
            review, project, assetKey, reviewLegacy));
        Assert.Equal(legacy, FindingSnapshotMergeKey.FromFinding(finding));
        Assert.Equal(findingId, finding.FindingId);

        return new Probe(legacy, canonical);
    }

    private static Task<CloudResourceIdentityRecord> SeedAsync(
        InMemoryCloudResourceIdentityDirectory directory, ScopeContext scope, string externalId) =>
        directory.UpsertOnSnapshotAsync(scope, CloudProvider.Azure, externalId, Guid.NewGuid(),
            "Microsoft.Storage/storageAccounts", null, null, null, null);

    private static ScopeContext NewScope(Guid? tenant = null, Guid? workspace = null) =>
        new() { TenantId = tenant ?? Guid.NewGuid(), WorkspaceId = workspace ?? Guid.NewGuid(), ProjectId = Guid.NewGuid() };

    private sealed record Probe(string V1, string? V2);

    private sealed class FixtureRulePack(string ruleId) : IComplianceRulePackProvider
    {
        public Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct) =>
            Task.FromResult(new ComplianceRulePack
            {
                RulePackId = "fnd062-cohort",
                Name = "FND-062 cohort",
                Version = "1",
                Rules = [new ComplianceRule { RuleId = ruleId }],
            });
    }
}
