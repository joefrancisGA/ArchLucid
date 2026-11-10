using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Pilot execute path: <c>X-ArchLucid-Pilot-Try-Real-Mode</c> headers drive first-real-value audit + counters.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class FirstRealValuePilotExecuteIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = IntegrationTestBase.CreateApiJsonOptions();

    private sealed class AuditEventCursorPage
    {
        public List<AuditEvent> Items
        {
            get;
            init;
        } = [];
    }

    [SkippableFact]
    public async Task ExecuteRun_WithPilotTryRealHeader_emitsFirstRealValueAuditEvents()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = await IntegrationTestSqlClientBootstrap.CreateSqlIntegrationClientAsync(factory)
            .ConfigureAwait(false);

        HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest("REQ-PILOT-REAL-1"));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        created.Should().NotBeNull();
        string runId = created.Run.RunId;
        bool parsed = Guid.TryParse(runId, out Guid runGuid);
        parsed.Should().BeTrue();

        using HttpRequestMessage execute = IntegrationTestRunLifecycleSupport.CreateExecuteReviewRequest(runId);
        execute.Headers.TryAddWithoutValidation(PilotTryRealModeHeaders.PilotTryRealMode, "1");

        HttpResponseMessage executeResponse = await client.SendAsync(execute);

        if (await executeResponse.IsAuthorityPipelineCompleteExecuteConflictAsync())
            Skip.If(true, "authority-pipeline complete on create; pilot execute audit test not applicable.");

        executeResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage auditStarted = await client.GetAsync(
            $"/v1/audit/search?eventType={Uri.EscapeDataString(AuditEventTypes.FirstRealValueRunStarted)}&runId={runGuid}&take=10");

        auditStarted.StatusCode.Should().Be(HttpStatusCode.OK);
        AuditEventCursorPage? startedPage = await auditStarted.Content.ReadFromJsonAsync<AuditEventCursorPage>(
            JsonOptions);
        startedPage.Should().NotBeNull();
        startedPage.Items.Should().Contain(e => e.EventType == AuditEventTypes.FirstRealValueRunStarted);

        HttpResponseMessage auditCompleted = await client.GetAsync(
            $"/v1/audit/search?eventType={Uri.EscapeDataString(AuditEventTypes.FirstRealValueRunCompleted)}&runId={runGuid}&take=10");

        auditCompleted.StatusCode.Should().Be(HttpStatusCode.OK);
        AuditEventCursorPage? completedPage = await auditCompleted.Content.ReadFromJsonAsync<AuditEventCursorPage>(
            JsonOptions);
        completedPage.Should().NotBeNull();
        completedPage.Items.Should().Contain(e => e.EventType == AuditEventTypes.FirstRealValueRunCompleted);
    }
}
