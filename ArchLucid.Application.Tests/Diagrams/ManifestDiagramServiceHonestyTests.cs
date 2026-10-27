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
}
