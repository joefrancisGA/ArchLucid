using ArchLucid.Application.TerraformAdvisory;
using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest;

using FluentAssertions;

using VerifyXunit;

namespace ArchLucid.Application.Tests.TerraformAdvisory;
[Trait("Category", "Unit")]

/// <summary>Snapshot baselines for advisory Terraform emits (no <c>terraform validate</c>; strings only).</summary>
public sealed class TerraformAdvisoryEmitSnapshotTests : VerifyBase
{
    public TerraformAdvisoryEmitSnapshotTests()
        : base()
    {
    }

    private static VerifySettings TerraformSnapshotSettings()
    {
        return new VerifySettings();
    }

    private static string NormalizeNewLines(string text)
    {
        return text.ReplaceLineEndings("\n");
    }

    /// <summary>
    ///     Snapshot files use LF only and a single trailing newline so baselines match across OS/editor defaults and
    ///     <see cref="TerraformAdvisoryDecommissionSnippetBuilder" /> outputs that omit a trailing newline.
    /// </summary>
    private static string NormalizeForVerifySnapshot(string text)
    {
        return NormalizeNewLines(text).TrimEnd() + "\n";
    }

    private static void AssertAdvisoryCommentLine(string snippet)
    {
        snippet.Should().Contain("# ArchLucid advisory");
    }

    [Fact]
    public Task Application_templates_example_right_size_vm_is_stable()
    {
        string snippet = NormalizeForVerifySnapshot(
            TerraformAdvisorySnippetTemplates.ExampleRightSizeVmSnippet("finding-1", "rec-a"));

        AssertAdvisoryCommentLine(snippet);

        return Verify(snippet, TerraformSnapshotSettings());
    }

    [Fact]
    public Task Application_templates_explainer_instead_of_destroy_is_stable()
    {
        string snippet = NormalizeForVerifySnapshot(
            TerraformAdvisorySnippetTemplates.ExplainerInsteadOfDestroy(
                "azurerm_virtual_machine.example",
                "protected until operator confirms in UI"));

        AssertAdvisoryCommentLine(snippet);

        return Verify(snippet, TerraformSnapshotSettings());
    }

    [Fact]
    public Task Decommission_snippet_uses_related_node_ids_as_address_hint()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "dec-node-1",
            Category = "Lifecycle",
            Title = "Decommission test workload",
            SelectedOption = "Option A",
            Rationale = "Cost",
            RelatedNodeIds = ["graph-node-1", "graph-node-2"],
        };

        string section = NormalizeForVerifySnapshot(
            TerraformAdvisoryDecommissionSnippetBuilder.BuildDecisionSection(decision));

        AssertAdvisoryCommentLine(section);

        return Verify(section, TerraformSnapshotSettings());
    }

    [Fact]
    public Task Decommission_snippet_uses_selected_option_when_it_looks_like_terraform_address()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "dec-addr-1",
            Category = "Lifecycle",
            Title = "Remove stale NIC",
            SelectedOption = "azurerm_network_interface.legacy",
            Rationale = "Orphan resource",
            RelatedNodeIds = [],
        };

        string section = NormalizeForVerifySnapshot(
            TerraformAdvisoryDecommissionSnippetBuilder.BuildDecisionSection(decision));

        AssertAdvisoryCommentLine(section);

        return Verify(section, TerraformSnapshotSettings());
    }

    [Fact]
    public Task Decommission_snippet_falls_back_when_no_address_hint()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "dec-fallback-1",
            Category = "Lifecycle",
            Title = "Tear down sandbox",
            SelectedOption = "SandboxOnly",
            Rationale = "No longer needed",
            RelatedNodeIds = [],
        };

        string section = NormalizeForVerifySnapshot(
            TerraformAdvisoryDecommissionSnippetBuilder.BuildDecisionSection(decision));

        AssertAdvisoryCommentLine(section);

        return Verify(section, TerraformSnapshotSettings());
    }

    [Fact]
    public Task Decommission_stub_when_manifest_has_no_decommission_decisions()
    {
        string stub = NormalizeForVerifySnapshot(
            TerraformAdvisoryDecommissionSnippetBuilder.BuildNoDecommissionManifestStub());

        AssertAdvisoryCommentLine(stub);

        return Verify(stub, TerraformSnapshotSettings());
    }

    [Fact]
    public async Task Artifact_generator_emits_stub_when_no_decommission_intent()
    {
        ManifestDocument manifest = CreateMinimalManifest();

        manifest.Decisions.Add(
            new ResolvedArchitectureDecision
            {
                DecisionId = "non-decom-1",
                Category = "Reliability",
                Title = "Add redundancy",
                SelectedOption = "Enable zone redundancy",
                Rationale = "Improve availability",
            });

        TerraformAdvisoryArtifactGenerator sut = new();
        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        string snapshot = NormalizeForVerifySnapshot(artifact.Content);

        AssertAdvisoryCommentLine(snapshot);

        await Verify(snapshot, TerraformSnapshotSettings());
    }

    [Fact]
    public async Task Artifact_generator_emits_sections_for_decommission_decisions()
    {
        ManifestDocument manifest = CreateMinimalManifest();

        manifest.Decisions.Add(
            new ResolvedArchitectureDecision
            {
                DecisionId = "d1",
                Category = "Cost",
                Title = "Decommission unused environment",
                SelectedOption = "Dev sandbox",
                Rationale = "Idle spend",
            });

        manifest.Decisions.Add(
            new ResolvedArchitectureDecision
            {
                DecisionId = "d2",
                Category = "Security",
                Title = "Key rotation",
                SelectedOption = "Standard rotation",
                Rationale = "Remove compromised credentials",
            });

        TerraformAdvisoryArtifactGenerator sut = new();
        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        string snapshot = NormalizeForVerifySnapshot(artifact.Content);

        AssertAdvisoryCommentLine(snapshot);

        await Verify(snapshot, TerraformSnapshotSettings());
    }

    private static ManifestDocument CreateMinimalManifest()
    {
        return new ManifestDocument
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ManifestId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ContextSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            GraphSnapshotId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            FindingsSnapshotId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa"),
            DecisionTraceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
            CreatedUtc = new DateTime(2026, 5, 16, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "test-hash",
            RuleSetId = "test-rules",
        };
    }
}
