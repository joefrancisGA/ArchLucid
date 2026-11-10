using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Architecture;
using ArchLucid.Decisioning.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Commit path through the real API host uses the production
///     <see cref="ArchLucid.Decisioning.Interfaces.IDecisionEngine" />
///     (not mocks). After ADR 0030 PR A3 (2026-04-24), the only commit path is the Authority FK chain Ã¢â‚¬” these tests
///     now assert the authority traceability invariant: the projected manifest must reference the rule-audit trace id
///     in <c>Metadata.DecisionTraceIds</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ArchitectureCommitTraceabilityIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = IntegrationTestBase.CreateApiJsonOptions();

    [SkippableFact]
    public async Task CommitRun_manifest_decision_trace_ids_align_with_returned_traces()
    {
        await IntegrationTestIsolatedSqlScope.RunAsync(async (client, factory) =>
        {
        HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(
            TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(ArchitectureCommitTraceabilityIntegrationTests))));

                CreateRunResponseDto? created =
            await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        created.Should().NotBeNull();
        string runId = created.Run.RunId;

        await client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(factory, runId);
        HttpResponseMessage commitResponse = await client.PostFinalizeForTestAsync(factory, runId);
        commitResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        CommitRunResponse? commitPayload =
            await commitResponse.ReadJsonForTestAsync<CommitRunResponse>(JsonOptions);
        commitPayload.Should().NotBeNull();

        IReadOnlyList<DecisionTrace> domainTraces = commitPayload.DecisionTraces
            .Select(DecisionTraceRecordMapper.ToDomain)
            .ToList();

        IReadOnlyList<string> gaps = AuthorityCommitTraceabilityRules.GetLinkageGaps(
            commitPayload.Manifest,
            domainTraces);

        gaps.Should()
            .BeEmpty(
                "manifest metadata must list exactly the authority rule-audit trace ids returned with the commit body");
        });
    }
}
