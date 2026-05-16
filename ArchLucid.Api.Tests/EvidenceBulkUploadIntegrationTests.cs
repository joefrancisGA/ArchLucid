using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Persistence.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using Microsoft.Extensions.DependencyInjection;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration tests for the EvidenceBulkUploadController.
/// </summary>
[Trait("Category", "Integration")]
public sealed class EvidenceBulkUploadIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task UploadBulkEvidence_With30Files_ReturnsSuccess_AndAudits()
    {
        // Arrange
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-BULK-001")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        using var content = new MultipartFormDataContent();
        for (int i = 0; i < 30; i++)
        {
            var fileContent = new ByteArrayContent([1, 2, 3]);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
            content.Add(fileContent, "files", $"file{i}.txt");
        }

        // Act
        HttpResponseMessage response = await Client.PostAsync($"/v1/architecture/run/{runId}/evidence/bulk", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        using var scope = Factory.Services.CreateScope();
        var auditRepo = scope.ServiceProvider.GetRequiredService<IAuditRepository>();
        var events = await auditRepo.GetByScopeAsync(ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject, 100, CancellationToken.None);
        
        var bulkEvents = events.Where(e => e.RunId == Guid.Parse(runId) && e.EventType == AuditEventTypes.EvidenceBulkAttached).ToList();
        bulkEvents.Should().HaveCount(1);
        bulkEvents[0].DataJson.Should().Contain("30");
    }

    [SkippableFact]
    public async Task UploadBulkEvidence_With31Files_ReturnsBadRequest_AndNoAudits()
    {
        // Arrange
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-BULK-002")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        using var content = new MultipartFormDataContent();
        for (int i = 0; i < 31; i++)
        {
            var fileContent = new ByteArrayContent([1, 2, 3]);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
            content.Add(fileContent, "files", $"file{i}.txt");
        }

        // Act
        HttpResponseMessage response = await Client.PostAsync($"/v1/architecture/run/{runId}/evidence/bulk", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problemDetails = await response.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>(JsonOptions);
        problemDetails.Should().NotBeNull();
        problemDetails!.Type.Should().Be(ProblemTypes.EvidenceBulkUploadLimitExceeded);

        using var scope = Factory.Services.CreateScope();
        var auditRepo = scope.ServiceProvider.GetRequiredService<IAuditRepository>();
        var events = await auditRepo.GetByScopeAsync(ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject, 100, CancellationToken.None);
        
        var bulkEvents = events.Where(e => e.RunId == Guid.Parse(runId) && e.EventType == AuditEventTypes.EvidenceBulkAttached).ToList();
        bulkEvents.Should().BeEmpty();
    }
}
