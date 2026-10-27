using ArchLucid.Application.Diagrams;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Diagrams;

[Trait("Suite", "Application")]
public sealed class ManifestDiagramServiceHonestyTests
{
    private readonly ManifestDiagramService _sut = new();

    [Fact]
    public void GenerateMermaid_semantic_overlay_uses_not_stored_actor_label_when_label_missing()
    {
        GoldenManifest manifest = new() { RunId = "run", SystemName = "Sys" };
        manifest.Services.Add(new ManifestService
        {
            ServiceId = "api",
            ServiceName = "Api",
            ServiceType = ServiceType.Api,
            RuntimePlatform = RuntimePlatform.AppService,
        });
        manifest.DiagramSemantics = new ManifestDiagramSemanticOverlay
        {
            Actors =
            [
                new ActorDescriptor
                {
                    Label = "   ",
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.Internal,
                    Contract = InteractionContract.Sync,
                },
            ],
        };

        string mermaid = _sut.GenerateMermaid(
            manifest,
            new ManifestDiagramOptions { IncludeSemanticOverlay = true });

        mermaid.Should().Contain("Actor label was not stored.");
        mermaid.Should().NotContain("Human · Human");
        mermaid.Should().NotContain("-.->");
    }

    [Fact]
    public void GenerateMermaid_semantic_overlay_uses_not_stored_trust_boundary_label_when_blank()
    {
        GoldenManifest manifest = new() { RunId = "run", SystemName = "Sys" };
        manifest.Services.Add(new ManifestService
        {
            ServiceId = "api",
            ServiceName = "Api",
            ServiceType = ServiceType.Api,
            RuntimePlatform = RuntimePlatform.AppService,
        });
        manifest.DiagramSemantics = new ManifestDiagramSemanticOverlay
        {
            TrustBoundaryLabels = ["  "],
        };

        string mermaid = _sut.GenerateMermaid(
            manifest,
            new ManifestDiagramOptions { IncludeSemanticOverlay = true });

        mermaid.Should().Contain("Trust boundary label was not stored.");
    }

    [Fact]
    public void GenerateMermaid_service_without_name_uses_not_stored_label()
    {
        GoldenManifest manifest = new() { RunId = "run", SystemName = "Sys" };
        manifest.Services.Add(new ManifestService
        {
            ServiceId = "api",
            ServiceName = "  ",
            ServiceType = ServiceType.Api,
            RuntimePlatform = RuntimePlatform.AppService,
        });

        string mermaid = _sut.GenerateMermaid(manifest);

        mermaid.Should().Contain("Service name was not stored.");
    }

    [Fact]
    public void GenerateMermaid_service_without_runtime_platform_uses_not_stored_label_when_requested()
    {
        GoldenManifest manifest = new() { RunId = "run", SystemName = "Sys" };
        manifest.Services.Add(new ManifestService
        {
            ServiceId = "api",
            ServiceName = "  ",
            ServiceType = ServiceType.Api,
            RuntimePlatform = RuntimePlatform.Unknown,
        });

        string mermaid = _sut.GenerateMermaid(manifest, new ManifestDiagramOptions { IncludeRuntimePlatform = true });

        mermaid.Should().Contain("Service name was not stored.");
        mermaid.Should().Contain("Runtime platform was not stored.");
    }

    [Fact]
    public void GenerateMermaid_decision_trace_fallback_uses_trace_line_when_id_stored()
    {
        GoldenManifest manifest = new() { RunId = "run", SystemName = "Sys" };
        manifest.Metadata.DecisionTraceIds.Add("trace-abc");

        string mermaid = _sut.GenerateMermaid(
            manifest,
            new ManifestDiagramOptions { IncludeSemanticOverlay = true });

        mermaid.Should().Contain("Decision trace: trace-abc");
    }

    [Fact]
    public void GenerateMermaid_does_not_treat_policy_constraints_as_requirements()
    {
        GoldenManifest manifest = new() { RunId = "run", SystemName = "Sys" };
        manifest.Governance.PolicyConstraints.Add("Encrypt data at rest");

        string mermaid = _sut.GenerateMermaid(
            manifest,
            new ManifestDiagramOptions { IncludeSemanticOverlay = true });

        mermaid.Should().NotContain("Encrypt data at rest");
        mermaid.Should().NotContain("subgraph requirements");
    }
}
