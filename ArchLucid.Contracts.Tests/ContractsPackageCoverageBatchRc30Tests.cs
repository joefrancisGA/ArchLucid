using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>RC30 package-coverage batch: draft intake, pilot headers, and context scope metadata keys.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc30Tests
{
    [Fact]
    public void DraftIntakeValidation_and_pilot_headers_expose_canonical_constants()
    {
        DraftIntakeValidation.MinimumFreeTextIntentLength.Should().Be(100);
        DraftIntakeValidation.MaximumFreeTextIntentLength.Should().Be(2_000_000);
        PilotTryRealModeHeaders.PilotTryRealMode.Should().Be("X-ArchLucid-Pilot-Try-Real-Mode");
    }

    [Fact]
    public void ContextScopeMetadataKeys_expose_archlucid_scope_hash_keys()
    {
        ContextScopeMetadataKeys.RequiredCapabilities.Should().Be("archlucid:requiredCapabilities");
        ContextScopeMetadataKeys.TopologyHints.Should().Be("archlucid:topologyHints");
        ContextScopeMetadataKeys.Constraints.Should().Be("archlucid:constraints");
        ContextScopeMetadataKeys.PriorTopologyCategories.Should().Be("archlucid:priorTopologyCategories");
    }

    [Fact]
    public void ArchitectureLinkageKinds_expose_node_edge_and_timeline_constants()
    {
        ArchitectureLinkageKinds.Nodes.Run.Should().Be("run");
        ArchitectureLinkageKinds.Nodes.AgentResult.Should().Be("agentResult");
        ArchitectureLinkageKinds.Edges.TaskYieldedResult.Should().Be("taskYieldedResult");
        ArchitectureLinkageKinds.Timeline.ManifestCommitted.Should().Be("manifestCommitted");
    }
}
