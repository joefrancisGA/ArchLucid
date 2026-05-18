using System.Globalization;
using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Tests for <c>GET /v1/audit/export/csv</c> (CSV-only export, search-compatible filter params).</summary>
[Trait("Category", "Integration")]
public sealed class AuditExportCsvControllerTests
{
    private static readonly Uri ExportCsvUri = new("/v1/audit/export/csv", UriKind.Relative);

    [SkippableFact]
    public async Task ExportAuditCsv_ReturnsCsvContentType_WithAttachmentDisposition()
    {
        await using AuditControllerSearchApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Mock<IAuditRepository> repo = factory.AuditRepositoryMock;

        repo
            .Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/csv"));

        HttpResponseMessage response = await client.GetAsync(ExportCsvUri);

        await response.EnsureSuccessForTestAsync();
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/csv");

        string? disposition = response.Content.Headers.ContentDisposition?.ToString();
        disposition.Should().NotBeNullOrWhiteSpace();

        string lower = disposition!.ToLowerInvariant();
        lower.Should().Contain("attachment");
        lower.Should().Contain("audit-export-");
        lower.Should().Contain(".csv");
    }

    [SkippableFact]
    public async Task ExportAuditCsv_ResponseBodyContainsCsvHeader()
    {
        await using AuditControllerSearchApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Mock<IAuditRepository> repo = factory.AuditRepositoryMock;

        repo
            .Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/csv"));

        HttpResponseMessage response = await client.GetAsync(ExportCsvUri);

        await response.EnsureSuccessForTestAsync();
        string body = await response.Content.ReadAsStringAsync();
        body.Should().StartWith("EventId,OccurredUtc,EventType,ActorUserId,ActorUserName,RunId,ManifestId,CorrelationId,DataJson");
    }

    [SkippableFact]
    public async Task ExportAuditCsv_WithEvent_IncludesRowInBody()
    {
        await using AuditControllerSearchApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Mock<IAuditRepository> repo = factory.AuditRepositoryMock;

        AuditEvent evt = new()
        {
            EventId = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2"),
            OccurredUtc = DateTime.Parse("2026-03-01T10:00:00Z", null, DateTimeStyles.RoundtripKind),
            EventType = "RunCreated",
            ActorUserId = "u2",
            ActorUserName = "User Two",
            TenantId = Guid.Empty,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            RunId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"),
            CorrelationId = "corr-2",
            DataJson = "{\"k\":1}"
        };

        repo
            .Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([evt]);

        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/csv"));

        HttpResponseMessage response = await client.GetAsync(ExportCsvUri);

        await response.EnsureSuccessForTestAsync();
        string body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2");
        body.Should().Contain("RunCreated");
        body.Should().Contain("corr-2");
    }

    [SkippableFact]
    public async Task ExportAuditCsv_PassesAllFilterParameters_ToRepository()
    {
        await using AuditControllerSearchApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Mock<IAuditRepository> repo = factory.AuditRepositoryMock;

        repo
            .Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Guid runId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
        Uri uri = new(
            $"/v1/audit/export/csv?fromUtc=2026-01-01T00:00:00.0000000Z&toUtc=2026-01-31T00:00:00.0000000Z&eventType=RunCreated&correlationId=cx&actorUserId=ux&runId={runId:D}",
            UriKind.Relative);

        HttpResponseMessage response = await client.GetAsync(uri);

        await response.EnsureSuccessForTestAsync();
        repo.Verify(
            r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.Is<AuditEventFilter>(f =>
                    f.EventType == "RunCreated"
                    && f.CorrelationId == "cx"
                    && f.ActorUserId == "ux"
                    && f.RunId == runId
                    && f.FromUtc.HasValue
                    && f.ToUtc.HasValue),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ExportAuditCsv_ClampsMaxRows_BeforeCallingRepository()
    {
        await using AuditControllerSearchApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Mock<IAuditRepository> repo = factory.AuditRepositoryMock;

        repo
            .Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        HttpResponseMessage response = await client.GetAsync("/v1/audit/export/csv?maxRows=9999999");

        await response.EnsureSuccessForTestAsync();
        repo.Verify(
            r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.Is<AuditEventFilter>(f => f.Take == 10_000),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ExportAuditCsv_InvalidDateRange_Returns400()
    {
        await using AuditControllerSearchApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync(
            "/v1/audit/export/csv?fromUtc=2026-02-01T00:00:00.0000000Z&toUtc=2026-01-01T00:00:00.0000000Z");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
