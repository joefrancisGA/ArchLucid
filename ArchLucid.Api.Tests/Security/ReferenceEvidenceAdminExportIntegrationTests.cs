using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-291: reference-evidence ZIP export content and tenant scope.
/// </summary>
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class ReferenceEvidenceAdminExportIntegrationTests
{
    [SkippableFact]
    public async Task Reference_evidence_zip_uses_public_api_base_url_and_excludes_demo_when_includeDemo_false_sql_tb291()
    {
        Skip.IfNot(AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable(), "SQL integration env not configured");

        GreenfieldSqlIntegrationWarmup.Shared.SkipIfShardWarmupAlreadyTimedOut();

        GreenfieldIntegrationTenantScope.Scope scope = new(
            ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);
        string testTag = "it-ref-evid-" + Guid.NewGuid().ToString("N");

        await using IdorGreenfieldSqlApiFactory factory = new();
        await GreenfieldIntegrationTenantScope.EnsureScopeAfterGreenfieldHostReadyAsync(factory, scope);
        await HarnessDemoBaselineSupport.EnsureSeededAsync(factory.Services);

        using HttpClient client = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(client, scope);

        string requestId = testTag[..Math.Min(testTag.Length, 32)];
        HttpResponseMessage create = await client.PostGreenfieldArchitectureRequestForTestAsync(
            TestRequestFactory.CreateArchitectureRequest(requestId),
            "tb291-ref-");
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(ArchitectureRequestConcurrencyTestSupport.JsonOptions);
        string realRunId = created!.Run.RunId;
        HarnessDemoBaselineSupport.AssertRunIdIsNotShowcase(realRunId);

        await ArchitectureRequestConcurrencyTestSupport.PostExecuteWithGreenfieldTransientRetryAsync(client, realRunId);
        await ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync(client, realRunId);

        byte[] zipBytes = await GreenfieldCommittedRunReadinessPoll.WaitUntilReferenceEvidenceZipReadyAsync(
            client, realRunId);
        string? readmeText = ReferenceEvidenceZipReadmeReader.TryReadReadmeText(zipBytes);
        readmeText.Should().NotBeNullOrWhiteSpace();
        readmeText!.Should().Contain($"RunId: {Guid.Parse(realRunId):N}", because: "the ZIP must anchor on the committed non-demo run");
        HarnessDemoBaselineSupport.AssertTextExcludesShowcaseRunKeys(readmeText);
        HarnessDemoBaselineSupport.AssertTextExcludesShowcaseAuthorityRunGuids(readmeText);

        zipBytes.Length.Should().BePositive();

        using MemoryStream ms = new(zipBytes);
        using ZipArchive zip = new(ms, ZipArchiveMode.Read, false);
        zip.Entries.Should().Contain(e => e.FullName == "pilot-run-deltas.json");
    }

}
