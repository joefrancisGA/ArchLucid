using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration tests for the EvidenceBulkUploadController.
/// </summary>
[Trait("Category", "Integration")]
public sealed class EvidenceBulkUploadIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task UploadBulkEvidence_With200Files_ReturnsSuccess_AndAudits()
    {
        CreatedRunForTest createdRun = await CreateRunForTestAsync();

        using var content = new MultipartFormDataContent();

        for (int i = 0; i < 200; i++)
        {
            ByteArrayContent fileContent = new([1, 2, 3]);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
            content.Add(fileContent, "files", $"file{i}.txt");
        }

        HttpResponseMessage response = await createdRun.PostEvidenceBulkHttpAsync(Client, content);

        string failureBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, failureBody);

        using IServiceScope scope = Factory.Services.CreateScope();
        IAuditRepository auditRepo = scope.ServiceProvider.GetRequiredService<IAuditRepository>();
        IReadOnlyList<AuditEvent> events = await auditRepo.GetByScopeAsync(
            ScopeIds.DefaultTenant,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject,
            100,
            CancellationToken.None);

        List<AuditEvent> bulkEvents = events
            .Where(e => e.RunId == createdRun.RunGuid && e.EventType == AuditEventTypes.EvidenceBulkAttached)
            .ToList();

        bulkEvents.Should().HaveCount(1);
        bulkEvents[0].DataJson.Should().Be("{}");

        AuditEventFilter payloadFilter = new()
        {
            EventType = AuditEventTypes.EvidenceBulkAttached,
            RunId = createdRun.RunGuid,
            Take = 10,
            IncludeDataJson = true,
        };

        IReadOnlyList<AuditEvent> bulkWithPayload = await auditRepo.GetFilteredAsync(
            ScopeIds.DefaultTenant,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject,
            payloadFilter,
            CancellationToken.None);

        bulkWithPayload.Should().HaveCount(1);
        bulkWithPayload[0].DataJson.Should().Contain("200");
    }

    [SkippableFact]
    public async Task UploadBulkEvidence_With201Files_ReturnsBadRequest_AndNoAudits()
    {
        CreatedRunForTest createdRun = await CreateRunForTestAsync();

        using var content = new MultipartFormDataContent();

        for (int i = 0; i < 201; i++)
        {
            ByteArrayContent fileContent = new([1, 2, 3]);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
            content.Add(fileContent, "files", $"file{i}.txt");
        }

        HttpResponseMessage response = await createdRun.PostEvidenceBulkHttpAsync(Client, content);

        System.Text.Json.JsonDocument problemDetails = await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.EvidenceBulkUploadLimitExceeded);
        problemDetails.RootElement.GetProperty("type").GetString().Should()
            .Be(ProblemTypes.EvidenceBulkUploadLimitExceeded);

        using IServiceScope scope = Factory.Services.CreateScope();
        IAuditRepository auditRepo = scope.ServiceProvider.GetRequiredService<IAuditRepository>();
        IReadOnlyList<AuditEvent> events = await auditRepo.GetByScopeAsync(
            ScopeIds.DefaultTenant,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject,
            100,
            CancellationToken.None);

        List<AuditEvent> bulkEvents = events
            .Where(e => e.RunId == createdRun.RunGuid && e.EventType == AuditEventTypes.EvidenceBulkAttached)
            .ToList();
        bulkEvents.Should().BeEmpty();
    }
}
