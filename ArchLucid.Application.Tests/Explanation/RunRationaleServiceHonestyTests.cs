using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Explanation;

[Trait("Suite", "Application")]
public sealed class RunRationaleServiceHonestyTests
{
    [Fact]
    public async Task GetRunRationaleAsync_uses_summary_not_stored_when_manifest_and_run_description_missing()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                Description = "   ",
            },
            FindingsSnapshot = new FindingsSnapshot { Findings = [] },
            AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DecisionTraceId = Guid.NewGuid(),
                RunId = runId,
                CreatedUtc = DateTime.UtcNow,
                RuleSetId = "core",
                RuleSetVersion = "1",
                RuleSetHash = "hash",
                AppliedRuleIds = [],
                AcceptedFindingIds = [],
                RejectedFindingIds = [],
                Notes = [],
            }),
        };

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(r => r.GetRunDetailAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Contracts.Architecture.ArchitectureRunDetail?)null);

        RunRationaleService sut = new(authority.Object, runDetail.Object);

        RunRationale? rationale = await sut.GetRunRationaleAsync(scope, runId, CancellationToken.None);

        rationale.Should().NotBeNull();
        rationale!.Summary.Should().Be(RunRationaleHonestyCopy.SummaryNotStored);
    }

    [Fact]
    public async Task GetRunRationaleAsync_run_event_trace_uses_event_description_not_stored_when_blank()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        RunDetailDto authorityDetail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
            },
            GoldenManifest = new ManifestDocument
            {
                Metadata = new ManifestMetadata { Summary = "Manifest summary for rationale." },
            },
        };
        ArchitectureRunDetail coordinatorDetail = new()
        {
            Run = new ArchitectureRun { RunId = runId.ToString("N"), Status = ArchitectureRunStatus.Committed },
            Results = [],
            DecisionTraces =
            [
                RunEventTraceDto.From(new RunEventTracePayload
                {
                    TraceId = "trace-1",
                    RunId = runId.ToString("N"),
                    EventType = "RunCompleted",
                    EventDescription = "  ",
                    CreatedUtc = DateTime.UtcNow,
                    Metadata = [],
                }),
            ],
        };

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(authorityDetail);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(r => r.GetRunDetailAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(coordinatorDetail);

        RunRationaleService sut = new(authority.Object, runDetail.Object);

        RunRationale? rationale = await sut.GetRunRationaleAsync(scope, runId, CancellationToken.None);

        rationale.Should().NotBeNull();
        rationale!.DecisionTraceEntries.Should().ContainSingle(e => e.Kind == "runEvent");
        rationale.DecisionTraceEntries[0].Description.Should().Be(RunRationaleHonestyCopy.EventDescriptionNotStored);
    }

    private static ScopeContext NewScope() =>
        new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
}
