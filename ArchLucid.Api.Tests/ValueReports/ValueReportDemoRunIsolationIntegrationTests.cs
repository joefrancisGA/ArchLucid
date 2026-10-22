using System.Net.Http.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Api.Tests.Security;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Api.Tests.ValueReports;

/// <summary>
///     TB-294: sponsor/value artifacts for real tenant runs must not embed canonical showcase demo run ids.
/// </summary>
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class ValueReportDemoRunIsolationIntegrationTests
{
    [SkippableFact]
    public async Task First_value_report_for_real_run_does_not_reference_showcase_demo_run_ids_sql_tb294()
    {
        Skip.IfNot(AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable(), "SQL integration env not configured");

        try
        {
            GreenfieldIntegrationTenantScope.Scope scope = GreenfieldIntegrationTenantScope.CreateUniqueScope();
            string testTag = "it-val-rpt-" + Guid.NewGuid().ToString("N");

            await using IdorGreenfieldSqlApiFactory factory = new();
            await GreenfieldIntegrationTenantScope.EnsureScopeAfterGreenfieldHostReadyAsync(factory, scope);

            using (HttpClient primer = factory.CreateClient())
            {
                GreenfieldIntegrationTenantScope.WireScope(primer, scope);
                await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
            }

            GreenfieldSqlIntegrationWarmup.SkipIfShardWarmupAlreadyTimedOut();

            using HttpClient client = factory.CreateClient();
            GreenfieldIntegrationTenantScope.WireScope(client, scope);

            string requestId = testTag[..Math.Min(testTag.Length, 32)];
            HttpResponseMessage create = await PostArchitectureRequestAsync(client, TestRequestFactory.CreateArchitectureRequest(requestId));
            await create.EnsureSuccessForTestAsync();
            CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(ArchitectureRequestConcurrencyTestSupport.JsonOptions);
            string realRunId = created!.Run.RunId;
            realRunId.Should().NotBe(ContosoRetailDemoIdentifiers.RunBaseline);
            realRunId.Should().NotBe(ContosoRetailDemoIdentifiers.RunHardened);

            await ArchitectureRequestConcurrencyTestSupport.PostExecuteAndCommitUnderGreenfieldBootstrapBudgetAsync(
                client,
                realRunId);

            string markdown = await GreenfieldCommittedRunReadinessPoll.WaitUntilFirstValueReportMarkdownReadyAsync(client, realRunId);

            markdown.Should().Contain(realRunId, because: "report must anchor on the committed integration run");
            markdown.Should().NotContain(ContosoRetailDemoIdentifiers.RunBaseline);
            markdown.Should().NotContain(ContosoRetailDemoIdentifiers.RunHardened);
            markdown.Should().NotContain(ContosoRetailDemoIdentifiers.AuthorityRunBaselineId.ToString("D"));
            markdown.Should().NotContain(ContosoRetailDemoIdentifiers.AuthorityRunHardenedId.ToString("D"));
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
        catch (GreenfieldCommitRetryBudgetExhaustedException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
    }

    private static Task<HttpResponseMessage> PostArchitectureRequestAsync(HttpClient client, object body)
    {
        string idempotencyKey = "tb294-val-" + Guid.NewGuid().ToString("N");
        return ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
            client,
            body,
            idempotencyKey);
    }
}
