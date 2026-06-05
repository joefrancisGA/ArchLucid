using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration tests: Architecture Ingestion (HTTP host, database, or cross-component).
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureIngestionIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CreateRun_WithIngestionFields_ReturnsCreated()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-INGEST-INT-001",
            Description =
                "Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.",
            SystemName = "IngestionIntegrationSys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Private endpoints required"],
            RequiredCapabilities = ["Azure AI Search", "SQL"],
            Assumptions = [],
            PriorManifestVersion = null,
            InlineRequirements = ["Must emit structured audit logs"],
            Documents =
            [
                new ContextDocumentRequest
                {
                    Name = "policy-hints.txt",
                    ContentType = "text/plain",
                    Content = "REQ: Multi-region failover\nPOL: Data classification enforced"
                }
            ],
            PolicyReferences = ["ORG-POL-42"],
            TopologyHints = ["hub-spoke with shared services subnet"],
            SecurityBaselineHints = ["TLS 1.2 minimum for all endpoints"],
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationRequest
                {
                    Name = "core.json",
                    Format = "json",
                    Content =
                        """{"resources":[{"type":"vnet","name":"core-vnet","region":"eastus","properties":{"addressSpace":"10.0.0.0/16"}}]}"""
                },
                new InfrastructureDeclarationRequest
                {
                    Name = "stub.tf",
                    Format = "simple-terraform",
                    Content = """
                              resource "azurerm_virtual_network" "core"
                              resource "azurerm_key_vault" "kv"
                              """
                }
            ]
        };

        HttpResponseMessage response = await Client.PostAsync("/v1/architecture/request", JsonContent(request));

        if (response.StatusCode != HttpStatusCode.Created)
        {
            string problemBody = await response.Content.ReadAsStringAsync();
            response.StatusCode.Should().Be(HttpStatusCode.Created, $"response: {problemBody}");
        }

        CreateRunResponseDto? payload = await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Run.RunId.Should().NotBeNullOrWhiteSpace();
        payload.Tasks.Should().NotBeEmpty();
    }
}
