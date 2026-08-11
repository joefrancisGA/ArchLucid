using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
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

/// <summary>
///     RC28e coverage batch for <see cref="RunRationaleService" /> authority, coordinator, and empty-detail paths.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunRationaleServiceRc28eTests
{
    [Fact]
    public async Task GetRunRationaleAsync_returns_null_when_authority_detail_missing()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);
        Mock<IRunDetailQueryService> runDetail = new(MockBehavior.Strict);

        RunRationaleService sut = new(authority.Object, runDetail.Object);

        RunRationale? rationale = await sut.GetRunRationaleAsync(scope, runId, CancellationToken.None);

        rationale.Should().BeNull();
    }

    [Fact]
    public async Task GetRunRationaleAsync_builds_authority_rationale_when_findings_snapshot_present()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        RunDetailDto detail = CreateAuthorityDetail(runId, includeFindings: true, includeProvenance: true);

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);
        Mock<IRunDetailQueryService> runDetail = new(MockBehavior.Strict);

        RunRationaleService sut = new(authority.Object, runDetail.Object);

        RunRationale? rationale = await sut.GetRunRationaleAsync(scope, runId, CancellationToken.None);

        rationale.Should().NotBeNull();
        rationale!.PipelineType.Should().Be("authority");
        rationale.Findings.Should().ContainSingle(f => f.FindingId == "finding-1");
        rationale.Findings[0].TraceCompleteness.Should().NotBeNull();
        rationale.DecisionTraceEntries.Should().ContainSingle(e => e.Kind == "ruleAudit");
        rationale.ProvenanceAvailable.Should().BeTrue();
        rationale.ExplanationAvailable.Should().BeTrue();
        rationale.Summary.Should().Be("Manifest summary for rationale.");
    }

    [Fact]
    public async Task GetRunRationaleAsync_builds_authority_rationale_without_findings_when_coordinator_missing()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        RunDetailDto detail = CreateAuthorityDetail(runId, includeFindings: false, includeProvenance: false);
        detail.GoldenManifest = null;
        detail.Run.Description = "Operator description fallback.";

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(r => r.GetRunDetailAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        RunRationaleService sut = new(authority.Object, runDetail.Object);

        RunRationale? rationale = await sut.GetRunRationaleAsync(scope, runId, CancellationToken.None);

        rationale.Should().NotBeNull();
        rationale!.PipelineType.Should().Be("authority");
        rationale.Findings.Should().BeEmpty();
        rationale.ProvenanceAvailable.Should().BeFalse();
        rationale.ExplanationAvailable.Should().BeFalse();
        rationale.Summary.Should().Be("Operator description fallback.");
        rationale.DecisionTraceEntries.Should().ContainSingle(e => e.Kind == "ruleAudit");
    }

    [Fact]
    public async Task GetRunRationaleAsync_builds_coordinator_rationale_when_findings_snapshot_missing()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RunDetailDto authorityDetail = CreateAuthorityDetail(runId, includeFindings: false, includeProvenance: true);
        ArchitectureRunDetail coordinatorDetail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId.ToString("N"),
                Status = ArchitectureRunStatus.Committed,
            },
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "agent-f-1",
                            Category = "Security",
                            Message = "Expose only private endpoints.",
                            Severity = FindingSeverity.Critical,
                            SourceAgent = AgentType.Compliance,
                            EvidenceRefs = ["node-1"],
                        },
                    ],
                },
            ],
            DecisionTraces =
            [
                RunEventTraceDto.From(new RunEventTracePayload
                {
                    TraceId = "trace-event-1",
                    RunId = runId.ToString("N"),
                    EventType = "CommitCompleted",
                    EventDescription = "Coordinator commit completed.",
                    CreatedUtc = new DateTime(2026, 8, 10, 12, 0, 0, DateTimeKind.Utc),
                    Metadata = new Dictionary<string, string> { ["actor"] = "coordinator" },
                }),
            ],
            Manifest = new ArchLucid.Contracts.Manifest.GoldenManifest
            {
                RunId = runId.ToString("N"),
                SystemName = "Coordinator System",
                Metadata = new ArchLucid.Contracts.Manifest.ManifestMetadata
                {
                    ChangeDescription = "Coordinator manifest summary.",
                },
            },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail.Setup(r => r.GetRunDetailAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(coordinatorDetail);

        RunRationaleService sut = new(authority.Object, runDetail.Object);

        RunRationale? rationale = await sut.GetRunRationaleAsync(scope, runId, CancellationToken.None);

        rationale.Should().NotBeNull();
        rationale!.PipelineType.Should().Be("coordinator");
        rationale.Findings.Should().ContainSingle(f => f.FindingId == "agent-f-1" && f.EngineType == AgentType.Compliance.ToString());
        rationale.DecisionTraceEntries.Should().ContainSingle(e => e.Kind == "runEvent");
        rationale.Summary.Should().Be("Manifest summary for rationale.");
        rationale.ProvenanceAvailable.Should().BeFalse();
        rationale.ExplanationAvailable.Should().BeTrue();
    }

    private static ScopeContext NewScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
    }

    private static RunDetailDto CreateAuthorityDetail(Guid runId, bool includeFindings, bool includeProvenance)
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ScopeProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            },
            GoldenManifest = new ManifestDocument
            {
                Metadata = new ManifestMetadata { Summary = "Manifest summary for rationale." },
            },
            AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                DecisionTraceId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                RunId = runId,
                CreatedUtc = new DateTime(2026, 8, 10, 0, 0, 0, DateTimeKind.Utc),
                RuleSetId = "core-default",
                RuleSetVersion = "2026.08",
                RuleSetHash = "hash",
                AppliedRuleIds = ["rule-1"],
                AcceptedFindingIds = ["finding-1"],
                RejectedFindingIds = [],
                Notes = ["accepted one finding"],
            }),
        };

        if (includeFindings)
        {
            detail.FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = "finding-1",
                        Title = "Private endpoint missing",
                        Rationale = "Data plane is public.",
                        Category = "Security",
                        EngineType = "SecurityEngine",
                        Severity = FindingSeverity.Critical,
                        RelatedNodeIds = ["node-1"],
                        RecommendedActions = ["Enable Private Link"],
                    },
                ],
            };
        }

        if (includeProvenance)
        {
            detail.GraphSnapshot = new ArchLucid.Contracts.Persistence.Graph.GraphSnapshot
            {
                GraphSnapshotId = Guid.NewGuid(),
            };
            detail.ContextSnapshot = new ArchLucid.Contracts.Persistence.Context.ContextSnapshot
            {
                SnapshotId = Guid.NewGuid(),
            };

            if (includeFindings)
            {
                detail.FindingsSnapshot ??= new FindingsSnapshot();
            }
        }

        return detail;
    }
}
