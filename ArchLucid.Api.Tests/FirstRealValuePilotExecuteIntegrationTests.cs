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
        HttpClient client = await IntegrationTestSqlClientBootstrap.CreateSqlIntegrationClientAsync(factory);

        HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(FirstRealValuePilotExecuteIntegrationTests))));

                CreateRunResponseDto? created =
            await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        created.Should().NotBeNull();
        string runId = created.Run.RunId;
        bool parsed = Guid.TryParse(runId, out Guid runGuid);
        parsed.Should().BeTrue();

        using HttpRequestMessage execute = IntegrationTestRunLifecycleSupport.CreateExecuteReviewRequest(runId);
        execute.Headers.TryAddWithoutValidation(PilotTryRealModeHeaders.PilotTryRealMode, "1");

        HttpResponseMessage executeResponse = await client.SendAsync(execute);

        await HarnessSkipWhen.AuthorityPipelineCompleteOnCreateForPilotAsync(executeResponse);

        executeResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage auditStarted = await client.GetAsync(
            $"/v1/audit/search?eventType={Uri.EscapeDataString(AuditEventTypes.FirstRealValueRunStarted)}&runId={runGuid}&take=10");        AuditEventCursorPage? startedPage = await auditStarted.ReadJsonForTestAsync<AuditEventCursorPage>(
            JsonOptions);
        startedPage.Should().NotBeNull();
        startedPage.Items.Should().Contain(e => e.EventType == AuditEventTypes.FirstRealValueRunStarted);

        HttpResponseMessage auditCompleted = await client.GetAsync(
            $"/v1/audit/search?eventType={Uri.EscapeDataString(AuditEventTypes.FirstRealValueRunCompleted)}&runId={runGuid}&take=10");        AuditEventCursorPage? completedPage = await auditCompleted.ReadJsonForTestAsync<AuditEventCursorPage>(
            JsonOptions);
        completedPage.Should().NotBeNull();
        completedPage.Items.Should().Contain(e => e.EventType == AuditEventTypes.FirstRealValueRunCompleted);
    }
}
