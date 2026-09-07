using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class KustomizeOverlayInfrastructureDeclarationParserTests
{
    private readonly KustomizeOverlayInfrastructureDeclarationParser _sut =
        new(NullLogger<KustomizeOverlayInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_OverlayAndDeploymentInBatch_MapsDeploymentObject()
    {
        InfrastructureDeclarationReference overlay = new()
        {
            Name = "overlays/prod/kustomization.yaml",
            Format = "kustomize",
            DeclarationId = "decl-kustomize-overlay",
            Content = """
                      resources:
                        - deployment.yaml
                      """,
        };

        InfrastructureDeclarationReference deployment = new()
        {
            Name = "overlays/prod/deployment.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-kustomize-deployment",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                        namespace: prod
                      """,
        };

        Dictionary<string, InfrastructureDeclarationReference> batchByPath =
            InfrastructureDeclarationBatchPathIndex.Build([overlay, deployment]);

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(overlay, batchByPath, CancellationToken.None);

        result.Should().ContainSingle(o =>
            o.Name == "prod/api"
            && o.ObjectType == "TopologyResource"
            && o.SourceId == "decl-kustomize-deployment");
    }

    [Fact]
    public async Task ParseAsync_RemoteBaseOnly_IsNoOp()
    {
        InfrastructureDeclarationReference overlay = new()
        {
            Name = "overlays/prod/kustomization.yaml",
            Format = "kustomize",
            DeclarationId = "decl-kustomize-remote",
            Content = """
                      bases:
                        - https://example.com/base
                      resources:
                        - https://github.com/org/repo//manifests
                      """,
        };

        Dictionary<string, InfrastructureDeclarationReference> batchByPath =
            InfrastructureDeclarationBatchPathIndex.Build([overlay]);

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(overlay, batchByPath, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_NestedKustomizationBase_ResolvesDeployment()
    {
        InfrastructureDeclarationReference overlay = new()
        {
            Name = "prod/kustomization.yaml",
            Format = "kustomize",
            DeclarationId = "decl-kustomize-overlay",
            Content = """
                      bases:
                        - base/kustomization.yaml
                      """,
        };

        InfrastructureDeclarationReference baseKustomization = new()
        {
            Name = "base/kustomization.yaml",
            Format = "kustomize",
            DeclarationId = "decl-kustomize-base",
            Content = """
                      resources:
                        - deployment.yaml
                      """,
        };

        InfrastructureDeclarationReference deployment = new()
        {
            Name = "base/deployment.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-kustomize-deployment",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                        namespace: default
                      """,
        };

        Dictionary<string, InfrastructureDeclarationReference> batchByPath =
            InfrastructureDeclarationBatchPathIndex.Build([overlay, baseKustomization, deployment]);

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(overlay, batchByPath, CancellationToken.None);

        result.Should().ContainSingle(o => o.Name == "default/api");
    }

    [Fact]
    public async Task NormalizeAsync_KustomizeBatch_SkipsStandaloneResourceParse()
    {
        InfrastructureDeclarationsPayloadNormalizer normalizer = new([
            _sut,
            new KubernetesYamlInfrastructureDeclarationParser(
                NullLogger<KubernetesYamlInfrastructureDeclarationParser>.Instance),
        ]);

        InfrastructureDeclarationsPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "overlays/prod/kustomization.yaml",
                    Format = "kustomize",
                    DeclarationId = "decl-kustomize-overlay",
                    Content = """
                              resources:
                                - deployment.yaml
                              """,
                },
                new InfrastructureDeclarationReference
                {
                    Name = "overlays/prod/deployment.yaml",
                    Format = "kubernetes-yaml",
                    DeclarationId = "decl-kustomize-deployment",
                    Content = """
                              apiVersion: apps/v1
                              kind: Deployment
                              metadata:
                                name: api
                                namespace: prod
                              """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle(o => o.Name == "prod/api");
        batch.CanonicalObjects[0].SourceId.Should().Be("decl-kustomize-deployment");
    }
}
