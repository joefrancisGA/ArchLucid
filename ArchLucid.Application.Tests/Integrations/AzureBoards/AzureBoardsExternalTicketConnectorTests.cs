using System.Net;
using System.Text.Json;

using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;
using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundSealedManifestTestSupport;

namespace ArchLucid.Application.Tests.Integrations.AzureBoards;

[Trait("Category", "Unit")]
public sealed class AzureBoardsExternalTicketConnectorTests
{
    [Fact]
    public async Task TryCreateForFindingAsync_succeeds_registers_correlation_and_emits_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f-1",
                "Azure Boards",
                "42",
                "42",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        InMemoryTenantAzureBoardsOutboundSettingsRepository settingsRepository = new();
        Guid tenantId = Scope().TenantId;
        await settingsRepository.UpsertAsync(
            tenantId,
            new TenantAzureBoardsOutboundSettings
            {
                ProjectName = "ArchLucid",
                DefaultWorkItemType = "Task",
            },
            CancellationToken.None);

        IntegrationsItsmOutboundOptions outbound = new()
        {
            AzureBoards = new AzureBoardsItsmOutboundOptions
            {
                OrganizationBaseUrl = "https://dev.azure.com/contoso",
                PersonalAccessToken = "pat-token",
            }
        };

        HttpMessageHandler handler = new StubHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"id":42,"url":"https://dev.azure.com/contoso/ArchLucid/_workitems/edit/42"}""")
            });

        AzureBoardsExternalTicketConnector sut = BuildConnector(
            correlations.Object,
            settingsRepository,
            CredentialResolver(outbound),
            PublicSiteMonitor("https://app.example").Object,
            new AzureBoardsOutboundIssueClient(new HttpClient(handler), NullLogger<AzureBoardsOutboundIssueClient>.Instance),
            CreateAuthorityQueryService(Scope(), Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd")),
            CreateManifestHashService());

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            new ExternalTicketCreateContext(
                Scope(),
                Inspect(FindingSeverity.Error, findingId: "f-1"),
                null,
                FindingSeverity.Error,
                "Finding summary",
                "Finding description"),
            CancellationToken.None);

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        result.ExternalKey.Should().Be("42");
        result.AuditEvents.Single().EventType.Should().Be(AuditEventTypes.IntegrationAzureBoardsWorkItemCreateSucceeded);
    }

    [Fact]
    public void BuildCreateWorkItemUri_uses_json_patch_work_item_endpoint()
    {
        Uri uri = AzureBoardsExternalTicketConnector.BuildCreateWorkItemUri(
            "https://dev.azure.com/contoso",
            "ArchLucid",
            "Task");

        uri.AbsoluteUri.Should().Be("https://dev.azure.com/contoso/ArchLucid/_apis/wit/workitems/$Task?api-version=7.1");
    }

    private static AzureBoardsExternalTicketConnector BuildConnector(
        IItsmFindingCorrelationRepository correlations,
        ITenantAzureBoardsOutboundSettingsRepository settingsRepository,
        IItsmTenantConnectorCredentialResolver credentialResolver,
        IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
        AzureBoardsOutboundIssueClient client,
        IAuthorityQueryService? authorityQueryService = null,
        IManifestHashService? manifestHashService = null) =>
        new(
            correlations,
            credentialResolver,
            publicSiteOptions,
            settingsRepository,
            client,
            HttpAuthenticator(),
            authorityQueryService ?? CreateAuthorityQueryService(Scope(), Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd")),
            manifestHashService ?? CreateManifestHashService());

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            HttpResponseMessage response = responder(request);
            request.Method.Should().Be(HttpMethod.Post);
            request.RequestUri!.AbsolutePath.Should().Contain("/_apis/wit/workitems/");
            request.Headers.Authorization!.Scheme.Should().Be("Basic");

            return Task.FromResult(response);
        }
    }
}
