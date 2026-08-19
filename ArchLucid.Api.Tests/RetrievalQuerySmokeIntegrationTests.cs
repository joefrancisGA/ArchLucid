using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     End-to-end: index documents via DI → query via <c>GET v1/retrieval/search</c> → assert hits.
///     Uses <see cref="AlertLifecycleWebAppFactory" /> (InMemory storage + <c>FakeEmbeddingService</c> +
///     <c>InMemoryVectorIndex</c>).
/// </summary>
// CI #2268: per-test factory — shared IClassFixture wedged all four tests at 150s when one request hung
// non-cancellably; each test seeds its own vector index state.
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class RetrievalQuerySmokeIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public Task A_Query_with_no_indexed_documents_returns_empty_list()
    {
        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();

        return IntegrationTestDeadline.RunAsync(
            nameof(A_Query_with_no_indexed_documents_returns_empty_list),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                HttpClient client = await CreateRetrievalSearchClientAsync(factory);
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                HttpResponseMessage response = await client.GetAsync(
                    new Uri("v1/retrieval/search?q=anything&topK=3", UriKind.Relative),
                    requestTimeout.Token);

                response.StatusCode.Should().Be(HttpStatusCode.OK);
                List<RetrievalHit>? hits = await response.Content
                    .ReadFromJsonAsync<List<RetrievalHit>>(JsonOptions, requestTimeout.Token);

                hits.Should().NotBeNull();
                hits.Should().BeEmpty("no documents have been indexed");
            },
            IntegrationTestDeadline.DefaultTestTimeout);
    }

    [SkippableFact]
    public Task B_Query_without_q_returns_bad_request()
    {
        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();

        return IntegrationTestDeadline.RunAsync(
            nameof(B_Query_without_q_returns_bad_request),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                HttpClient client = await CreateRetrievalSearchClientAsync(factory);
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                HttpResponseMessage response = await client.GetAsync(
                    new Uri("v1/retrieval/search?q=", UriKind.Relative),
                    requestTimeout.Token);

                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            },
            IntegrationTestDeadline.DefaultTestTimeout);
    }

    [SkippableFact]
    public Task C_Index_documents_then_query_returns_matching_hits()
    {
        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();

        return IntegrationTestDeadline.RunAsync(
            nameof(C_Index_documents_then_query_returns_matching_hits),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);

                await SeedRetrievalDocumentsAsync(services, requestTimeout.Token);

                HttpClient client = await CreateRetrievalSearchClientAsync(factory);

                HttpResponseMessage response = await client.GetAsync(
                    new Uri("v1/retrieval/search?q=microservices+topology&topK=5", UriKind.Relative),
                    requestTimeout.Token);

                response.StatusCode.Should().Be(HttpStatusCode.OK);
                List<RetrievalHit>? hits = await response.Content
                    .ReadFromJsonAsync<List<RetrievalHit>>(JsonOptions, requestTimeout.Token);

                hits.Should().NotBeNull();
                hits.Should().NotBeEmpty("indexed documents should produce at least one retrieval hit");
            },
            IntegrationTestDeadline.DefaultTestTimeout);
    }

    [SkippableFact]
    public Task D_TopK_clamps_result_count()
    {
        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();

        return IntegrationTestDeadline.RunAsync(
            nameof(D_TopK_clamps_result_count),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);

                await SeedRetrievalDocumentsAsync(services, requestTimeout.Token);

                HttpClient client = await CreateRetrievalSearchClientAsync(factory);

                HttpResponseMessage response = await client.GetAsync(
                    new Uri("v1/retrieval/search?q=architecture&topK=1", UriKind.Relative),
                    requestTimeout.Token);

                response.StatusCode.Should().Be(HttpStatusCode.OK);
                List<RetrievalHit>? hits = await response.Content
                    .ReadFromJsonAsync<List<RetrievalHit>>(JsonOptions, requestTimeout.Token);

                hits.Should().NotBeNull();
                hits.Should().HaveCountLessThanOrEqualTo(1);
            },
            IntegrationTestDeadline.DefaultTestTimeout);
    }

    private static async Task SeedRetrievalDocumentsAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        using IServiceScope scope = services.CreateScope();
        IRetrievalIndexingService indexingService =
            scope.ServiceProvider.GetRequiredService<IRetrievalIndexingService>();

        List<RetrievalDocument> documents =
        [
            new()
            {
                DocumentId = "doc-arch-001",
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
                RunId = null,
                ManifestId = null,
                SourceType = "Manifest",
                SourceId = "manifest-001",
                Title = "Architecture Topology",
                Content =
                    "The system uses a microservices topology with three primary services: API Gateway, Order Service, and Payment Service.",
                ContentHash = "hash-001",
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            new()
            {
                DocumentId = "doc-arch-002",
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
                RunId = null,
                ManifestId = null,
                SourceType = "Artifact",
                SourceId = "artifact-001",
                Title = "Security Baseline",
                Content =
                    "All inter-service communication is encrypted using mTLS. No public SMB (port 445) exposure is permitted.",
                ContentHash = "hash-002",
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            }
        ];

        await indexingService.IndexDocumentsAsync(documents, cancellationToken);
    }

    private static async Task<HttpClient> CreateRetrievalSearchClientAsync(AlertLifecycleWebAppFactory factory)
    {
        HttpClient client = await AlertLifecycleIntegrationHost.EnsureClientAsync(factory);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        return client;
    }
}
