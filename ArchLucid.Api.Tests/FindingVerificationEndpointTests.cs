using System.Net;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for ADR 0062 slice 1 finding verification reports (DX-19).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.DemoBaselineTraitCategory, HarnessGoldenPathGuardConstants.DemoBaselineTraitValue)]
public sealed class FindingVerificationEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task PostFindingVerification_when_seeded_returns_201_with_not_verifiable_results()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;

        HttpResponseMessage response = await Client.PostRunFindingVerificationHttpAsync(
            runId,
            IntegrationTestHttpContent.CreateJson(new CreateFindingVerificationReportRequest(), JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        FindingVerificationReportResponse? report =
            await response.ReadJsonForTestAsync<FindingVerificationReportResponse>(JsonOptions);

        report.Should().NotBeNull();
        report!.RunId.Should().Be(runId);
        report.SourceManifestHash.Should().NotBeNullOrWhiteSpace();
        report.Results.Should().NotBeEmpty();
        report.Results.Should().OnlyContain(result => result.Status == FindingVerificationStatus.NotVerifiable);
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_run_unknown_returns_404()
    {
        HttpResponseMessage response = await Client.PostRunFindingVerificationHttpAsync(
            HarnessWellKnownGuids.MismatchedRunForScopedFindingInspect,
            IntegrationTestHttpContent.CreateJson(new CreateFindingVerificationReportRequest(), JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_other_tenant_scope_returns_404()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;

        using HttpClient foreignClient = HarnessDemoBaselineSupport.CreateForeignTenantClient(Factory);

        HttpResponseMessage response = await foreignClient.PostRunFindingVerificationHttpAsync(
            runId,
            IntegrationTestHttpContent.CreateJson(new CreateFindingVerificationReportRequest(), JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostFindingVerification_when_body_missing_returns_400()
    {
        HttpResponseMessage response = await Client.PostRunFindingVerificationHttpAsync(
            HarnessDemoBaselineSupport.AuthorityRunId,
            null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
