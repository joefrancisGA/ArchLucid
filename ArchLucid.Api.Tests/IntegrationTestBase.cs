using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Base for API integration tests: provides an <see cref="HttpClient" /> from <see cref="ArchLucidApiFactory" /> and
///     JSON helpers aligned with the API’s serializer settings.
///     Harness cheat sheet — arrange: <see cref="ArrangeFinalizedAsync" /> / <see cref="ArrangeCommittedPairAsync" />;
///     act: <see cref="Client" />; assert bodies: <see cref="ArchLucidHttpResponseIntegrationTestExtensions.ReadJsonForTestAsync" />,
///     <see cref="ArchLucidHttpResponseIntegrationTestExtensions.ReadBytesForTestAsync" />,
///     <see cref="ArchLucidHttpResponseIntegrationTestExtensions.AssertProblemForTestAsync" />.
/// </summary>
public class IntegrationTestBase(ArchLucidApiFactory factory) : IClassFixture<ArchLucidApiFactory>, IAsyncLifetime
{
    /// <summary>Distinct actor for governance submit vs review in DevelopmentBypass integration tests.</summary>
    protected const string GovernanceSubmitterName = "governance-submitter";

    protected const string GovernanceSubmitterId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    /// <summary>
    ///     DevelopmentBypass authentication emits <c>tenant_id</c> scope claims (TB-072); scope headers align the client
    ///     with <see cref="ScopeIds" /> defaults so SQL-backed <c>CommercialTenantTierFilter</c> can resolve <c>dbo.Tenants</c>.
    /// </summary>
    protected HttpClient Client { get; private set; } = null!;

    /// <summary>
    ///     Aligned with <see cref="ArchLucid.Api.Startup.MvcExtensions" /> API JSON options (camelCase properties, string
    ///     enums).
    /// </summary>
    protected readonly JsonSerializerOptions JsonOptions = CreateApiJsonOptions();

    /// <summary>JSON options aligned with the API serializer; shared by <see cref="ReplaySession" />.</summary>
    public static JsonSerializerOptions CreateApiJsonOptions() =>
        new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            DictionaryKeyPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new EvalCorpusFindingSeverityJsonConverter(), new JsonStringEnumConverter(null) }
        };

    /// <summary>API JSON options with relaxed escaping (provenance / embedded JSON in Problem Details).</summary>
    public static JsonSerializerOptions CreateRelaxedEscapingJsonOptions()
    {
        JsonSerializerOptions options = CreateApiJsonOptions();
        options.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;

        return options;
    }

    /// <summary>Golden-path helpers for comparison replay tests using this fixture's client and factory.</summary>
    protected ReplaySession Replay => ReplaySession.From(Factory, Client, JsonOptions);

    /// <summary>POST <c>/v1/architecture/request</c> with the standard integration payload.</summary>
    protected Task<HttpResponseMessage> PostArchitectureRequestAsync(string requestId) =>
        Client.PostArchitectureRequestForTestAsync(requestId);

    /// <summary>Builds an intake <see cref="HttpRequestMessage" /> with optional custom content.</summary>
    protected static HttpRequestMessage CreateArchitectureRequestMessage(HttpContent? body = null) =>
        IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(body);

    /// <summary>Creates a run via the architecture request endpoint and returns the new run id.</summary>
    protected Task<string> CreateArchitectureRunAsync(string requestId) =>
        IntegrationTestRunLifecycleSupport.CreateArchitectureRunForTestAsync(Client, JsonOptions, requestId);

    /// <summary>Execute with κ pin refresh (preferred before finalize).</summary>
    protected Task ExecuteForTestAsync(string runId) =>
        Client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(Factory, runId);

    /// <summary>Finalize with κ pin refresh.</summary>
    protected Task<HttpResponseMessage> FinalizeRunAsync(string runId, HttpContent? body = null) =>
        Client.PostFinalizeForTestAsync(Factory, runId, body);

    /// <summary>Create → execute → finalize; returns run id and committed manifest version.</summary>
    protected Task<FinalizedRun> CreateFinalizedRunAsync(string requestId) =>
        IntegrationTestRunLifecycleSupport.CreateFinalizedRunForTestAsync(Client, Factory, JsonOptions, requestId);

    /// <summary>Create → execute → finalize using the fixture class and calling test for <see cref="TestRequestIds.ForScenario" />.</summary>
    protected Task<FinalizedRun> ArrangeFinalizedAsync([CallerMemberName] string testMethod = "") =>
        HarnessArrange.FinalizedAsync(Client, Factory, JsonOptions, GetType().Name, testMethod);

    /// <summary>Finalize + commit-replay pair using the fixture class and calling test.</summary>
    protected Task<CommittedReplayPair> ArrangeCommittedPairAsync([CallerMemberName] string testMethod = "") =>
        HarnessArrange.CommittedPairAsync(Replay, GetType().Name, testMethod);

    /// <summary>Governance committed run using the fixture class and calling test.</summary>
    protected Task<FinalizedRun> ArrangeGovernanceCommittedAsync([CallerMemberName] string testMethod = "") =>
        HarnessArrange.GovernanceCommittedAsync(Client, Factory, JsonOptions, GetType().Name, testMethod);

    /// <summary>POST architecture request with caller-aware request id; returns run id and request id.</summary>
    protected async Task<CreatedRunForTest> CreateRunForTestAsync([CallerMemberName] string testMethod = "")
    {
        string requestId = TestRequestIds.ForScenario(GetType().Name, testMethod);
        HttpResponseMessage createResponse =
            await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(requestId));
        CreateRunResponseDto created =
            await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);

        return new CreatedRunForTest(created.Run.RunId, requestId);
    }

    /// <summary>POST <c>/v1/architecture/comparisons/{comparisonRecordId}/replay</c>.</summary>
    protected Task<HttpResponseMessage> PostComparisonReplayAsync(string comparisonRecordId, string format = "markdown") =>
        Client.PostComparisonReplayForTestAsync(comparisonRecordId, format);

    /// <summary>Factory for the hosted API (singleton services, SQL connection string, etc.).</summary>
    protected ArchLucidApiFactory Factory
    {
        get;
    } = factory;

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        Client = await IntegrationTestSqlClientBootstrap.CreateSqlIntegrationClientAsync(Factory).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    /// <summary>
    ///     Serializes <paramref name="value" /> with <see cref="JsonOptions" /> and returns <see cref="StringContent" />
    ///     suitable for <c>application/json</c> POST bodies.
    /// </summary>
    protected StringContent JsonContent(object value) =>
        IntegrationTestHttpContent.CreateJson(value, JsonOptions);

    /// <summary>
    ///     POST <c>/v1/governance/approval-requests</c> using explicit camelCase JSON keys so binding stays stable across
    ///     CI hosts (anonymous projection payloads have proven flaky versus MVC deserialization).
    /// </summary>
    protected Task<HttpResponseMessage> PostGovernanceApprovalRequestAsync(
        string runId,
        string manifestVersion = "v1",
        string sourceEnvironment = "dev",
        string targetEnvironment = "test",
        string? requestComment = null,
        string? testActorName = null,
        string? testActorId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Dictionary<string, object?> payload =
            new()
            {
                ["runId"] = runId,
                ["manifestVersion"] = manifestVersion,
                ["sourceEnvironment"] = sourceEnvironment,
                ["targetEnvironment"] = targetEnvironment
            };

        if (requestComment is not null)
            payload["requestComment"] = requestComment;

        string json = JsonSerializer.Serialize(payload, JsonOptions);
        StringContent content = new(json, Encoding.UTF8, "application/json");

        return PostGovernanceMutationAsync(
            "/v1/governance/approval-requests",
            content,
            Guid.NewGuid().ToString("N"),
            testActorName,
            testActorId);
    }

    /// <summary>
    ///     JSON for governance <c>.../approve</c> and <c>.../reject</c> bodies; explicit camelCase keys for stable MVC
    ///     binding across CI hosts.
    /// </summary>
    protected StringContent GovernanceReviewDecisionJsonContent(string reviewedBy, string? reviewComment = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedBy);

        Dictionary<string, object?> payload = new()
        {
            ["reviewedBy"] = reviewedBy
        };

        if (reviewComment is not null)
            payload["reviewComment"] = reviewComment;

        string json = JsonSerializer.Serialize(payload, JsonOptions);

        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    /// <summary>
    ///     POST <c>/v1/governance/activations</c> using explicit camelCase keys so binding stays stable across CI hosts.
    /// </summary>
    protected Task<HttpResponseMessage> PostGovernanceActivationAsync(
        string runId,
        string manifestVersion = "v1",
        string environment = "dev",
        string? testActorName = null,
        string? testActorId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Dictionary<string, object?> payload =
            new()
            {
                ["runId"] = runId,
                ["manifestVersion"] = manifestVersion,
                ["environment"] = environment
            };

        string json = JsonSerializer.Serialize(payload, JsonOptions);
        StringContent content = new(json, Encoding.UTF8, "application/json");

        return PostGovernanceMutationAsync(
            "/v1/governance/activations",
            content,
            Guid.NewGuid().ToString("N"),
            testActorName,
            testActorId);
    }

    /// <summary>
    ///     POST <c>/v1/governance/promotions</c> using explicit camelCase keys so binding stays stable across CI hosts.
    /// </summary>
    protected Task<HttpResponseMessage> PostGovernancePromotionAsync(
        string runId,
        string promotedBy,
        string manifestVersion = "v1",
        string sourceEnvironment = "dev",
        string targetEnvironment = "test",
        string? approvalRequestId = null,
        string? notes = null,
        string? testActorName = null,
        string? testActorId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(promotedBy);

        Dictionary<string, object?> payload =
            new()
            {
                ["runId"] = runId,
                ["manifestVersion"] = manifestVersion,
                ["sourceEnvironment"] = sourceEnvironment,
                ["targetEnvironment"] = targetEnvironment,
                ["promotedBy"] = promotedBy
            };

        if (approvalRequestId is not null)
            payload["approvalRequestId"] = approvalRequestId;

        if (notes is not null)
            payload["notes"] = notes;

        string json = JsonSerializer.Serialize(payload, JsonOptions);
        StringContent content = new(json, Encoding.UTF8, "application/json");

        return PostGovernanceMutationAsync(
            "/v1/governance/promotions",
            content,
            Guid.NewGuid().ToString("N"),
            testActorName,
            testActorId);
    }

    /// <summary>
    ///     POST with <c>Idempotency-Key</c> for persisted governance mutations (submit approval, promote, activate).
    ///     Optional test actor headers apply when both <paramref name="testActorName" /> and
    ///     <paramref name="testActorId" /> are non-empty (requires <c>ArchLucidAuth:AllowTestActorHeaders</c>).
    /// </summary>
    protected async Task<HttpResponseMessage> PostGovernanceMutationAsync(
        string relativeUrl,
        HttpContent content,
        string idempotencyKey,
        string? testActorName = null,
        string? testActorId = null)
    {
        if (content is null)
            throw new ArgumentNullException(nameof(content));

        if (string.IsNullOrWhiteSpace(idempotencyKey))
            throw new ArgumentException("Idempotency key is required.", nameof(idempotencyKey));

        using HttpRequestMessage request = new(HttpMethod.Post, relativeUrl);
        request.Content = content;

        _ = request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        if (!string.IsNullOrWhiteSpace(testActorName) && !string.IsNullOrWhiteSpace(testActorId))
            ApplyTestActorHeaders(request, testActorName, testActorId);

        return await Client.SendAsync(request);
    }

    /// <summary>JSON body with a unique idempotency key and default DevelopmentBypass actor.</summary>
    protected Task<HttpResponseMessage> PostGovernanceMutationAsync(string relativeUrl, object body)
    {
        return PostGovernanceMutationAsync(relativeUrl, body, null, null);
    }

    /// <summary>JSON body, idempotency key, and optional DevelopmentBypass test actor override.</summary>
    protected Task<HttpResponseMessage> PostGovernanceMutationAsync(
        string relativeUrl,
        object body,
        string? testActorName,
        string? testActorId)
    {
        return PostGovernanceMutationAsync(
            relativeUrl,
            JsonContent(body),
            Guid.NewGuid().ToString("N"),
            testActorName,
            testActorId);
    }

    /// <summary>POST JSON as a specific test actor (no idempotency): approve/reject and similar actions.</summary>
    protected Task<HttpResponseMessage> PostJsonAsTestActorAsync(
        string relativeUrl,
        object body,
        string testActorName,
        string testActorId)
    {
        ArgumentNullException.ThrowIfNull(body);

        return PostJsonAsTestActorAsync(relativeUrl, JsonContent(body), testActorName, testActorId);
    }

    /// <inheritdoc cref="PostJsonAsTestActorAsync(string,object,string,string)" />
    protected async Task<HttpResponseMessage> PostJsonAsTestActorAsync(
        string relativeUrl,
        HttpContent content,
        string testActorName,
        string testActorId)
    {
        ArgumentNullException.ThrowIfNull(content);

        using HttpRequestMessage request = new(HttpMethod.Post, relativeUrl);
        request.Content = content;

        ApplyTestActorHeaders(request, testActorName, testActorId);

        return await Client.SendAsync(request);
    }

    private static void ApplyTestActorHeaders(HttpRequestMessage request, string testActorName, string testActorId)
    {
        if (string.IsNullOrWhiteSpace(testActorName) || string.IsNullOrWhiteSpace(testActorId))
            throw new ArgumentException("Test actor name and id are required.");

        _ = request.Headers.TryAddWithoutValidation(ArchLucidAuthOptions.TestActorNameHeader, testActorName.Trim());
        _ = request.Headers.TryAddWithoutValidation(ArchLucidAuthOptions.TestActorIdHeader, testActorId.Trim());
    }

    /// <summary>
    ///     Adds <c>x-tenant-id</c> / <c>x-workspace-id</c> / <c>x-project-id</c> for DevelopmentBypass + SQL integration
    ///     hosts.
    /// </summary>
    public static void WireDefaultSqlIntegrationScopeHeaders(HttpClient client)
    {
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-workspace-id",
            ScopeIds.DefaultWorkspace.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-project-id", ScopeIds.DefaultProject.ToString("D"));
    }
}
