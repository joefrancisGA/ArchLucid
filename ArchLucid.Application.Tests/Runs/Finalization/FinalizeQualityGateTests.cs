using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>TB-2321: the injectable gate is a no-op when disabled and throws 409-mapped conflicts when enabled.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FinalizeQualityGateTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task EnsurePassOrThrowAsync_is_noop_when_disabled_even_with_open_work()
    {
        Mock<IFindingReviewTrailRepository> trail = new(MockBehavior.Strict);
        FinalizeQualityGate gate = new(Options.Create(new FinalizeQualityGateOptions { Enabled = false }), trail.Object);
        FindingsSnapshot findings = new() { Findings = [OpenCritical("Public storage account")] };

        await gate.EnsurePassOrThrowAsync(Scope, new ArchitectureRequest(), findings);

        trail.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task EnsurePassOrThrowAsync_passes_when_enabled_and_nothing_is_open()
    {
        Mock<IFindingReviewTrailRepository> trail = NewTrail([]);
        FinalizeQualityGate gate = new(Options.Create(new FinalizeQualityGateOptions { Enabled = true }), trail.Object);
        Finding approved = OpenCritical("Approved risk");
        approved.HumanReviewStatus = FindingHumanReviewStatus.Approved;

        Func<Task> act = () => gate.EnsurePassOrThrowAsync(
            Scope,
            new ArchitectureRequest(),
            new FindingsSnapshot { Findings = [approved] });

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnsurePassOrThrowAsync_throws_conflict_with_ui_copy_when_enabled_and_blocked()
    {
        Mock<IFindingReviewTrailRepository> trail = NewTrail([]);
        FinalizeQualityGate gate = new(Options.Create(new FinalizeQualityGateOptions { Enabled = true }), trail.Object);
        FindingsSnapshot findings = new() { Findings = [OpenCritical("Public storage account")] };

        Func<Task> act = () => gate.EnsurePassOrThrowAsync(Scope, new ArchitectureRequest(), findings);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage(
                FinalizeQualityGate.BlockedPrefix
                + "1 high-severity finding still need an accepted-risk disposition or decision-register row before finalize.");
    }

    [Fact]
    public async Task EnsurePassOrThrowAsync_uses_latest_disposition_from_review_trail_scoped_to_workspace_and_project()
    {
        Finding remediated = OpenCritical("Fixed risk");
        Finding otherProject = OpenCritical("Someone else's fix");
        FindingReviewEventRecord inScope = Disposition(remediated.FindingId, FindingDisposition.Remediated, Scope.ProjectId);
        FindingReviewEventRecord outOfScope = Disposition(otherProject.FindingId, FindingDisposition.Remediated, Guid.NewGuid());
        Mock<IFindingReviewTrailRepository> trail = NewTrail([inScope, outOfScope]);
        FinalizeQualityGate gate = new(Options.Create(new FinalizeQualityGateOptions { Enabled = true }), trail.Object);

        Func<Task> act = () => gate.EnsurePassOrThrowAsync(
            Scope,
            new ArchitectureRequest(),
            new FindingsSnapshot { Findings = [remediated, otherProject] });

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*1 high-severity finding still need*");
        trail.Verify(
            repository => repository.ListForFindingIdsSinceUtcAsync(
                Scope.TenantId,
                It.Is<IReadOnlyCollection<string>>(ids => ids.Count == 2),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EnsurePassOrThrowAsync_joins_multiple_reasons_in_ui_order()
    {
        Mock<IFindingReviewTrailRepository> trail = NewTrail([]);
        FinalizeQualityGate gate = new(Options.Create(new FinalizeQualityGateOptions { Enabled = true }), trail.Object);
        Finding question = OpenCritical("Cannot determine TLS termination point");
        question.Severity = FindingSeverity.Warning;
        Finding open = OpenCritical("Public storage account");

        Func<Task> act = () => gate.EnsurePassOrThrowAsync(
            Scope,
            new ArchitectureRequest(),
            new FindingsSnapshot { Findings = [question, open] });

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage(
                FinalizeQualityGate.BlockedPrefix
                + "1 open question still need answers before the package is defensible. "
                + "1 high-severity finding still need an accepted-risk disposition or decision-register row before finalize.");
    }

    [Fact]
    public async Task EnsurePassOrThrowAsync_rejects_null_arguments()
    {
        FinalizeQualityGate gate = new(
            Options.Create(new FinalizeQualityGateOptions { Enabled = true }),
            NewTrail([]).Object);

        Func<Task> nullScope = () => gate.EnsurePassOrThrowAsync(null!, new ArchitectureRequest(), new FindingsSnapshot());
        Func<Task> nullRequest = () => gate.EnsurePassOrThrowAsync(Scope, null!, new FindingsSnapshot());
        Func<Task> nullFindings = () => gate.EnsurePassOrThrowAsync(Scope, new ArchitectureRequest(), null!);

        await nullScope.Should().ThrowAsync<ArgumentNullException>();
        await nullRequest.Should().ThrowAsync<ArgumentNullException>();
        await nullFindings.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_rejects_null_dependencies()
    {
        Action nullOptions = () => _ = new FinalizeQualityGate(null!, NewTrail([]).Object);
        Action nullTrail = () => _ = new FinalizeQualityGate(Options.Create(new FinalizeQualityGateOptions()), null!);

        nullOptions.Should().Throw<ArgumentNullException>();
        nullTrail.Should().Throw<ArgumentNullException>();
    }

    private static Mock<IFindingReviewTrailRepository> NewTrail(List<FindingReviewEventRecord> events)
    {
        Mock<IFindingReviewTrailRepository> trail = new(MockBehavior.Strict);
        trail
            .Setup(repository => repository.ListForFindingIdsSinceUtcAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(events);

        return trail;
    }

    private static FindingReviewEventRecord Disposition(string findingId, FindingDisposition disposition, Guid projectId)
    {
        return new FindingReviewEventRecord
        {
            EventId = Guid.NewGuid(),
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = projectId,
            FindingId = findingId,
            ReviewerUserId = "reviewer",
            Action = FindingReviewAction.RecordDisposition,
            Disposition = disposition,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        };
    }

    private static Finding OpenCritical(string title)
    {
        Finding finding = new()
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Title = title,
            Rationale = string.Empty,
            Severity = FindingSeverity.Critical,
            FindingType = "test",
            Category = "test",
            EngineType = "test",
        };

        finding.EvidenceRefs.Add("doc-1");

        return finding;
    }
}
