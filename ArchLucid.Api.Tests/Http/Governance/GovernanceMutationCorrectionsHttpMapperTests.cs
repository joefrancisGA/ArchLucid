using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceMutationCorrectionsHttpMapperTests
{
    [Fact]
    public void ValidateRecordMutationCorrection_rejects_overlong_run_id()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = overlongRunId,
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.RunIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateRecordMutationCorrection_rejects_overlong_subject_id()
    {
        string overlongSubjectId = new string('s', GovernanceRequestValidationRules.FindingIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = overlongSubjectId,
                RunId = Guid.NewGuid().ToString("D"),
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.FindingIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateRecordMutationCorrection_rejects_overlong_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = Guid.NewGuid().ToString("D"),
                Rationale = new string('x', FindingDispositionValidation.MaximumRationaleLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MaximumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateRecordMutationCorrection_rejects_empty_guid_run_id()
    {
        GovernanceHttpValidation? validation = GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = Guid.Empty.ToString("D"),
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Be("RunId is not valid.");
    }

    [Fact]
    public void ValidateRecordMutationCorrection_rejects_non_guid_run_id()
    {
        GovernanceHttpValidation? validation = GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = "apr-1",
                RunId = "not-a-guid",
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Be("RunId is not valid.");
    }
}
