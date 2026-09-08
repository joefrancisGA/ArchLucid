using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Tests.Governance.FindingDisposition.Support;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;
using FindingDispositionService = ArchLucid.Application.Governance.FindingDisposition.FindingDispositionService;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

[Trait("Category", "Unit")]
public sealed class FindingDispositionApplyChangePreviewAttestationTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly ScopeContext Scope = new()
    {
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectId,
    };

    [Fact]
    public void Validate_working_remediated_requires_impact_preview_attestation()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.ValidateWorkingRemediatedImpactPreviewAttestation(request, true);

        act.Should().Throw<ArgumentException>().WithMessage("*Impact preview attestation*");
    }

    [Fact]
    public void Validate_working_remediated_accepts_impact_preview_completed()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = Disposition.Remediated,
            ImpactPreviewCompleted = true,
        };

        Action act = () => FindingDispositionValidation.ValidateWorkingRemediatedImpactPreviewAttestation(request, true);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_working_remediated_accepts_preview_override_reason()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = Disposition.Remediated,
            PreviewOverrideReason = "Record an override and continue without a completed impact preview",
        };

        Action act = () => FindingDispositionValidation.ValidateWorkingRemediatedImpactPreviewAttestation(request, true);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_guided_remediated_does_not_require_impact_preview_attestation()
    {
        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = Disposition.Remediated,
        };

        Action act = () => FindingDispositionValidation.ValidateWorkingRemediatedImpactPreviewAttestation(request, false);

        act.Should().NotThrow();
    }

    [Fact]
    public async Task RecordAsync_working_remediated_rejects_session_storage_only_attestation()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = FindingDispositionServiceTestFactory.Create(trailRepository, isWorkingDesk: true);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = Disposition.Remediated,
            Rationale = "Remediation shipped in release 2.4.",
        };

        Func<Task> act = () => sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Impact preview attestation*");
    }

    [Fact]
    public async Task RecordAsync_working_remediated_records_preview_attestation_in_notes()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = FindingDispositionServiceTestFactory.Create(trailRepository, isWorkingDesk: true);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = Disposition.Remediated,
            Rationale = "Remediation shipped in release 2.4.",
            ImpactPreviewCompleted = true,
        };

        FindingDispositionEventDto result = await sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        result.Rationale.Should().Contain("Impact preview completed before remediated disposition.");
    }
}
