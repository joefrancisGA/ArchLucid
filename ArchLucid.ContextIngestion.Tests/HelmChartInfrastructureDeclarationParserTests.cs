using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class HelmChartInfrastructureDeclarationParserTests
{
    private readonly HelmChartInfrastructureDeclarationParser _sut =
        new(NullLogger<HelmChartInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_DeploymentTemplateWithoutGoTemplates_MapsCanonicalObject()
    {
        InfrastructureDeclarationReference chart = new()
        {
            Name = "charts/api/Chart.yaml",
            Format = "helm",
            DeclarationId = "decl-helm-chart",
            Content = """
                      apiVersion: v2
                      name: api
                      version: 1.0.0
                      """,
        };

        InfrastructureDeclarationReference template = new()
        {
            Name = "charts/api/templates/deployment.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-helm-template",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                        namespace: prod
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(
            chart,
            [chart, template],
            CancellationToken.None);

        result.Should().ContainSingle(o =>
            o.Name == "prod/api"
            && o.ObjectType == "TopologyResource"
            && o.SourceId == "decl-helm-template");
    }

    [Fact]
    public async Task ParseAsync_GoTemplateDocument_IsSkipped()
    {
        InfrastructureDeclarationReference chart = new()
        {
            Name = "charts/api/Chart.yaml",
            Format = "helm",
            DeclarationId = "decl-helm-chart",
            Content = """
                      apiVersion: v2
                      name: api
                      version: 1.0.0
                      """,
        };

        InfrastructureDeclarationReference template = new()
        {
            Name = "charts/api/templates/deployment.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-helm-template",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: {{ .Values.name }}
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(
            chart,
            [chart, template],
            CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_MissingChartYaml_IsNoOp()
    {
        InfrastructureDeclarationReference templateOnly = new()
        {
            Name = "charts/api/templates/deployment.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-helm-template",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(
            templateOnly,
            [templateOnly],
            CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task NormalizeAsync_HelmBatch_SkipsStandaloneTemplateParse()
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
                    Name = "charts/api/Chart.yaml",
                    Format = "helm",
                    DeclarationId = "decl-helm-chart",
                    Content = """
                              apiVersion: v2
                              name: api
                              version: 1.0.0
                              """,
                },
                new InfrastructureDeclarationReference
                {
                    Name = "charts/api/templates/deployment.yaml",
                    Format = "kubernetes-yaml",
                    DeclarationId = "decl-helm-template",
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
        batch.CanonicalObjects[0].SourceId.Should().Be("decl-helm-template");
    }
}
