using System.Net;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Templates;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Each test uses a new <see cref="ArchLucidApiFactory" /> so the per-test SQL Server database is isolated (see
///     <c>docs/BUILD.md</c> for connection resolution).
///     Shared state could collide when multiple tests reuse one factory database for the same <c>RunId</c> Ã¢â‚¬”
///     <c>dbo.GoldenManifests</c> enforces at most one active manifest per run (filtered unique index
///     <c>UQ_GoldenManifests_RunId_Active</c>; see <c>dbo.sp_FinalizeManifest</c>).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ArchitectureControllerTests
{
    private static readonly JsonSerializerOptions JsonOptions = IntegrationTestBase.CreateApiJsonOptions();

    [SkippableFact]
    public async Task CreateRun_ReturnsRun()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            object request = TestRequestFactory.CreateArchitectureRequest("REQ-API-001");

            HttpResponseMessage response = await client.PostArchitectureRequestForTestAsync(request);

            CreateRunResponseDto? payload = await response.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
            payload.Run.Should().NotBeNull();
            payload.Run.RunId.Should().NotBeNullOrWhiteSpace();
            payload.Run.RequestId.Should().Be("REQ-API-001");
            payload.Tasks.Should().HaveCount(4);
            payload.Tasks.Select(t => t.AgentType).Should().Contain([
                "Topology",
                "Cost",
                "Compliance",
                "Critic"
            ]);
        });
    }

    [SkippableFact]
    public async Task GetRun_ReturnsTasks()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(ArchitectureControllerTests))));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            string runId = created.Run.RunId;

            HttpResponseMessage getResponse = await client.GetRunHttpAsync(runId);

            GetRunResponseDto? payload = await getResponse.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions);
            payload.Run.RunId.Should().Be(runId);
            payload.Tasks.Should().HaveCount(4);
            payload.Results.Should().BeEmpty();
        });
    }

    [SkippableFact]
    public async Task ExecuteRun_SeedsResults()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(ArchitectureControllerTests))));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            string runId = created.Run.RunId;

            HttpResponseMessage executeResponse = await client.PostExecuteForTestAsync(runId);

            if (await executeResponse.IsAuthorityPipelineCompleteExecuteConflictAsync())
            {
                HttpResponseMessage seededRunResponse = await client.GetRunHttpAsync(runId);
                GetRunResponseDto? seededPayload =
                    await seededRunResponse.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions);
                seededPayload!.Results.Should().HaveCount(4);
                return;
            }

            ExecuteRunResponseDto? executePayload =
                await executeResponse.ReadJsonForTestAsync<ExecuteRunResponseDto>(JsonOptions);
            executePayload.RunId.Should().Be(runId);
            executePayload.Results.Should().HaveCount(4);

            HttpResponseMessage getRunResponse = await client.GetRunHttpAsync(runId);
            GetRunResponseDto? getRunPayload =
                await getRunResponse.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions);
            getRunPayload.Results.Should().HaveCount(4);
        });
    }

    [SkippableFact]
    public async Task CommitRun_CreatesManifest()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            const string requestId = "REQ-API-004";
            string systemName = TestRequestFactory.SystemNameForRequest(requestId);

            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(requestId));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
            string runId = created.Run.RunId;

            await client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(factory, runId);
            HttpResponseMessage commitResponse = await client.PostFinalizeForTestAsync(factory, runId);

            CommitRunResponseDto? commitPayload =
                await commitResponse.ReadJsonForTestAsync<CommitRunResponseDto>(JsonOptions);
            commitPayload.Manifest.Should().NotBeNull();
            commitPayload.Manifest.RunId.Should().Be(runId);
            commitPayload.Manifest.SystemName.Should().Be(systemName);
            commitPayload.Manifest.Services.Should().NotBeEmpty();
            commitPayload.Manifest.Datastores.Should().NotBeEmpty();
            commitPayload.Manifest.Governance.RequiredControls.Should().Contain(c =>
                c.Equals("Managed Identity", StringComparison.OrdinalIgnoreCase));
            commitPayload.DecisionTraces.Should().NotBeEmpty();
        });
    }

    [SkippableFact]
    public async Task ExecuteRun_ExecutesTasksAndReturnsResults()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(ArchitectureControllerTests))));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
            string runId = created.Run.RunId;

            HttpResponseMessage executeResponse = await client.PostExecuteForTestAsync(runId);

            if (await executeResponse.IsAuthorityPipelineCompleteExecuteConflictAsync())
            {
                HttpResponseMessage getRunResponse = await client.GetRunHttpAsync(runId);
                GetRunResponseDto? seededPayload =
                    await getRunResponse.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions);
                seededPayload!.Results.Should().HaveCount(4);
                return;
            }

            ExecuteRunResponseDto? executePayload =
                await executeResponse.ReadJsonForTestAsync<ExecuteRunResponseDto>(JsonOptions);
            executePayload.RunId.Should().Be(runId);
            executePayload.Results.Should().HaveCount(4);
        });
    }

    [SkippableFact]
    public async Task GoldenPath_EndToEnd_WithExecute()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            const string requestId = "REQ-API-006";
            string systemName = TestRequestFactory.SystemNameForRequest(requestId);

            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(requestId));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            string runId = created.Run.RunId;
            runId.Should().NotBeNullOrWhiteSpace();

            await client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(factory, runId);
            HttpResponseMessage commitResponse = await client.PostFinalizeForTestAsync(factory, runId);
            CommitRunResponseDto? commitPayload =
                await commitResponse.ReadJsonForTestAsync<CommitRunResponseDto>(JsonOptions);

            string manifestVersion = commitPayload.Manifest.Metadata.ManifestVersion;
            manifestVersion.Should()
                .NotBeNullOrWhiteSpace(
                    "ADR 0030 PR A3 Ã¢â‚¬” authority engine projects v-prefixed semver via AuthorityCommitProjectionBuilder.MapMetadata");
            manifestVersion.Should().StartWith("v");

            HttpResponseMessage manifestResponse =
                await client.GetArchitectureManifestHttpAsync(manifestVersion);
            ManifestDto? manifestPayload = await manifestResponse.ReadJsonForTestAsync<ManifestDto>(JsonOptions);
            manifestPayload.SystemName.Should().Be(systemName);
            manifestPayload.Services.Should().NotBeEmpty();
            manifestPayload.Datastores.Should().NotBeEmpty();
            manifestPayload.Governance.RequiredControls.Should().NotBeEmpty();
            manifestPayload.Metadata.DecisionTraceIds.Should().NotBeEmpty();
        });
    }

    [SkippableFact]
    public async Task GoldenPath_EndToEnd()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            const string requestId = "REQ-API-005";
            string systemName = TestRequestFactory.SystemNameForRequest(requestId);

            HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(requestId));

            CreateRunResponseDto? created =
                await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            string runId = created.Run.RunId;
            runId.Should().NotBeNullOrWhiteSpace();

            HttpResponseMessage getRunResponse = await client.GetRunHttpAsync(runId);
            GetRunResponseDto? getRunPayload =
                await getRunResponse.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions);
            getRunPayload.Tasks.Should().HaveCount(4);

            await client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(factory, runId);
            HttpResponseMessage commitResponse = await client.PostFinalizeForTestAsync(factory, runId);
            CommitRunResponseDto? commitPayload =
                await commitResponse.ReadJsonForTestAsync<CommitRunResponseDto>(JsonOptions);

            string manifestVersion = commitPayload.Manifest.Metadata.ManifestVersion;
            manifestVersion.Should()
                .NotBeNullOrWhiteSpace(
                    "ADR 0030 PR A3 Ã¢â‚¬” authority engine projects v-prefixed semver via AuthorityCommitProjectionBuilder.MapMetadata");
            manifestVersion.Should().StartWith("v");

            HttpResponseMessage manifestResponse =
                await client.GetArchitectureManifestHttpAsync(manifestVersion);
            ManifestDto? manifestPayload = await manifestResponse.ReadJsonForTestAsync<ManifestDto>(JsonOptions);
            manifestPayload.SystemName.Should().Be(systemName);
            manifestPayload.Services.Should().Contain(s => s.ServiceName == "rag-api");
            manifestPayload.Services.Should().Contain(s => s.ServiceName == "rag-search");
            manifestPayload.Datastores.Should().Contain(d => d.DatastoreName == "rag-metadata");
            manifestPayload.Governance.RequiredControls.Should().Contain(c =>
                c.Equals("Private Endpoints", StringComparison.OrdinalIgnoreCase));
            manifestPayload.Metadata.DecisionTraceIds.Should().NotBeEmpty();
        });
    }

    [SkippableFact]
    public async Task CreateRun_SameIdempotencyKeyAndBody_SecondCallReturns200WithSameRunId()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            string idempotencyKey = $"idem-{Guid.NewGuid():N}";
            object body = TestRequestFactory.CreateArchitectureRequest("REQ-IDEM-001");
            using HttpRequestMessage first =
                IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(IntegrationTestHttpContent.CreateJson(body, JsonOptions), idempotencyKey);

            HttpResponseMessage firstResponse = await client.SendAsync(first);

            CreateRunResponseDto? firstPayload =
                await firstResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

            using HttpRequestMessage second =
                IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(IntegrationTestHttpContent.CreateJson(body, JsonOptions), idempotencyKey);

            HttpResponseMessage secondResponse = await client.SendAsync(second);
            secondResponse.Headers.TryGetValues("X-Idempotency-Replayed", out IEnumerable<string>? replayValues).Should()
                .BeTrue();
            replayValues.Should().Contain("true");

            CreateRunResponseDto? secondPayload =
                await secondResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
            secondPayload.Run.RunId.Should().Be(firstPayload.Run.RunId);
        });
    }

    [SkippableFact]
    public async Task CreateRun_SameIdempotencyKeyDifferentBody_Returns409()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            string idempotencyKey = $"idem-{Guid.NewGuid():N}";
            object firstBody = TestRequestFactory.CreateArchitectureRequest("REQ-IDEM-002A");
            using HttpRequestMessage first =
                IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(IntegrationTestHttpContent.CreateJson(firstBody, JsonOptions), idempotencyKey);

            HttpResponseMessage firstResponse = await client.SendAsync(first);
            await firstResponse.EnsureSuccessForTestAsync();
            object secondBody = TestRequestFactory.CreateArchitectureRequest("REQ-IDEM-002B");
            using HttpRequestMessage second =
                IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(IntegrationTestHttpContent.CreateJson(secondBody, JsonOptions), idempotencyKey);

            HttpResponseMessage secondResponse = await client.SendAsync(second);
            secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
        });
    }

    [SkippableFact]
    public async Task CreateRun_ParallelSameIdempotencyKeyAndBody_AllSucceedWithSingleRunId()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            string idempotencyKey = $"idem-parallel-{Guid.NewGuid():N}";
            object body = TestRequestFactory.CreateArchitectureRequest("REQ-IDEM-PAR");

            const int parallel = 10;
            Task<HttpResponseMessage>[] tasks = new Task<HttpResponseMessage>[parallel];

            for (int i = 0; i < parallel; i++)
            {
                tasks[i] = PostCreateWithIdempotencyAsync(client, body, idempotencyKey);
            }

            HttpResponseMessage[] responses = await Task.WhenAll(tasks);

            HashSet<string> runIds = new(StringComparer.OrdinalIgnoreCase);
            int createdCount = 0;

            foreach (HttpResponseMessage response in responses)
            {
                (response.StatusCode is HttpStatusCode.Created or HttpStatusCode.OK)
                    .Should()
                    .BeTrue();

                if (response.StatusCode == HttpStatusCode.Created)
                {
                    createdCount++;
                }

                CreateRunResponseDto? payload =
                    await response.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
                runIds.Add(payload.Run.RunId);
            }

            createdCount.Should().Be(1, "exactly one parallel request should create the run; others replay");
            runIds.Should().HaveCount(1, "all responses must reference the same authority run id");
        });
    }

    [SkippableFact]
    public async Task GetArchitectureRequestTemplates_ReturnsCatalogSummariesWithExpectedIds()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            HttpResponseMessage response = await client.GetArchitectureRequestTemplatesHttpAsync();

            List<ArchitectureRequestTemplateSummary>? items =
                await response.ReadJsonForTestAsync<List<ArchitectureRequestTemplateSummary>>(JsonOptions);

            items.Should().HaveCount(7);

            string[] ids = items!.Select(i => i.Id).OrderBy(s => s).ToArray();
            ids.Should().Equal(
                "hipaa-compliant-api",
                "microservices-aks",
                "microservices-gke",
                "pci-dss-payment-gateway",
                "serverless-api",
                "serverless-api-aws",
                "webapp-sql");

            items.Select(i => i.Id).Should().OnlyHaveUniqueItems();
        });
    }

    [SkippableFact]
    public async Task Post_each_catalog_template_creates_valid_run()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
            ArchitectureRequest[] templates =
            [
                ArchitectureRequestTemplates.MicroservicesWebPlatform($"tpl-api-mw-{Guid.NewGuid():N}"),
                ArchitectureRequestTemplates.MonolithMigrationAssessment($"tpl-api-mono-{Guid.NewGuid():N}"),
                ArchitectureRequestTemplates.EventDrivenProcessingPipeline($"tpl-api-ev-{Guid.NewGuid():N}"),
                ArchitectureRequestTemplates.CloudNativeMigration($"tpl-api-az-{Guid.NewGuid():N}"),
                ArchitectureRequestTemplates.RegulatedHealthcareSystem($"tpl-api-phi-{Guid.NewGuid():N}"),
                ArchitectureRequestTemplates.RetailBankingAndPaymentsPlatform($"tpl-api-fin-{Guid.NewGuid():N}"),
                ArchitectureRequestTemplates.SmartManufacturingOtItReference($"tpl-api-mfg-{Guid.NewGuid():N}")
            ];

            foreach (ArchitectureRequest template in templates)
            {
                HttpResponseMessage response =
                    await client.PostArchitectureRequestForTestAsync(template);

                if (response.StatusCode != HttpStatusCode.Created)
                {
                    string problemBody = await response.Content.ReadAsStringAsync();
                    response.StatusCode.Should().Be(HttpStatusCode.Created,
                        $"template {template.SystemName} should create a run; response: {problemBody}");
                }

                CreateRunResponseDto? payload =
                    await response.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
                payload.Run.RunId.Should().NotBeNullOrWhiteSpace();
            }
        });
    }

    private static async Task<HttpResponseMessage> PostCreateWithIdempotencyAsync(
        HttpClient client,
        object body,
        string idempotencyKey)
    {
        using HttpRequestMessage request =
            IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(IntegrationTestHttpContent.CreateJson(body, JsonOptions), idempotencyKey);

        return await client.SendAsync(request);
    }
}
