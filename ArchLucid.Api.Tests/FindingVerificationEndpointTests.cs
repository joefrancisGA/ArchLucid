using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for ADR 0062 slice 1 finding verification reports (DX-19).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class FindingVerificationEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private async Task EnsureDemoBaselineSeededAsync()
    {
        using IServiceScope serviceScope = Factory.Services.CreateScope();
        await serviceScope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_seeded_returns_201_with_not_verifiable_results()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        CreateFindingVerificationReportRequest body = new();

        HttpResponseMessage response = await Client.PostAsJsonAsync(
            $"/v1/runs/{runId:D}/finding-verification",
            body,
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        FindingVerificationReportResponse? report =
            await response.Content.ReadFromJsonAsync<FindingVerificationReportResponse>(JsonOptions);

        report.Should().NotBeNull();
        report!.RunId.Should().Be(runId);
        report.SourceManifestHash.Should().NotBeNullOrWhiteSpace();
        report.Results.Should().NotBeEmpty();
        report.Results.Should().OnlyContain(result => result.Status == FindingVerificationStatus.NotVerifiable);
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_run_unknown_returns_404()
    {
        Guid unknownRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        HttpResponseMessage response = await Client.PostAsJsonAsync(
            $"/v1/runs/{unknownRunId:D}/finding-verification",
            new CreateFindingVerificationReportRequest(),
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_other_tenant_scope_returns_404()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;

        using HttpClient foreignClient = Factory.CreateClient();
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-tenant-id",
            Guid.Parse("77777777-7777-7777-7777-777777777777").ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-workspace-id",
            ScopeIds.DefaultWorkspace.ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-project-id",
            ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage response = await foreignClient.PostAsJsonAsync(
            $"/v1/runs/{runId:D}/finding-verification",
            new CreateFindingVerificationReportRequest(),
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_body_missing_returns_400()
    {
        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/runs/{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:D}/finding-verification",
            null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
