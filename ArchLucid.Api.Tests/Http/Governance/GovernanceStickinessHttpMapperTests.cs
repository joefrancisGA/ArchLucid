using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceStickinessHttpMapperTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(501)]
    public void ValidateRegisterMaxRows_rejects_out_of_range(int maxRows)
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRegisterMaxRows(maxRows);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidateCreateRiskException_requires_run_and_finding()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.Empty,
                FindingId = " ",
                OwnerUserId = "owner",
                Rationale = "rationale",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("runId");
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_overlong_finding_id()
    {
        string overlongFindingId = new string('f', GovernanceRequestValidationRules.FindingIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = overlongFindingId,
                OwnerUserId = "owner",
                Rationale = "accepted risk rationale",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.FindingIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateCreateRiskException_requires_evidence_ref()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "accepted risk rationale",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("evidenceRef");
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_past_expires_at_utc()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "accepted risk rationale",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("future");
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_expires_at_utc_beyond_max_duration()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "accepted risk rationale",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(RiskExceptionValidation.MaxDurationDays + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RiskExceptionValidation.MaxDurationDays.ToString());
    }

    [Fact]
    public void ValidateRenewRiskException_rejects_past_expires_at_utc()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRenewRiskException(
            new RenewRiskExceptionRequest
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("future");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_whitespace_only_optional_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Remediated,
                Rationale = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("rationale");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_optional_evidence_request_text_on_non_needs_evidence_disposition()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Remediated,
                EvidenceRequestText = "please provide staging evidence logs",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("evidenceRequestText");
        validation.Message.Should().Contain("not applicable");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_whitespace_only_optional_evidence_request_text()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Remediated,
                EvidenceRequestText = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("evidenceRequestText");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_revisit_due_on_non_deferred_disposition()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Remediated,
                RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("revisitDueUtc");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_optional_trade_off_acknowledgment_on_non_accepted_disposition()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Deferred,
                RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
                TradeOffAcknowledgment = "accepting latency trade-off for lower cost",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("tradeOffAcknowledgment");
        validation.Message.Should().Contain("not applicable");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_whitespace_only_optional_trade_off_acknowledgment()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Deferred,
                RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
                TradeOffAcknowledgment = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("tradeOffAcknowledgment");
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_overlong_owner_user_id()
    {
        string overlongOwnerUserId = new string('o', RiskExceptionValidation.OwnerUserIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = overlongOwnerUserId,
                Rationale = "accepted risk rationale",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RiskExceptionValidation.OwnerUserIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_overlong_evidence_ref()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "accepted risk rationale",
                EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RiskExceptionValidation.EvidenceRefMaxLength.ToString());
    }

    [Fact]
    public void ValidateCreateRecurrenceSchedule_rejects_whitespace_only_name()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule(
            new CreateArchitectureReviewRecurrenceScheduleRequest
            {
                SourceRunId = Guid.NewGuid(),
                Name = "   ",
                IsEnabled = true,
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateCreateRecurrenceSchedule_rejects_whitespace_only_cron_expression()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule(
            new CreateArchitectureReviewRecurrenceScheduleRequest
            {
                SourceRunId = Guid.NewGuid(),
                CronExpression = "   ",
                IsEnabled = true,
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateCreateRecurrenceSchedule_rejects_overlong_name()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule(
            new CreateArchitectureReviewRecurrenceScheduleRequest
            {
                SourceRunId = Guid.NewGuid(),
                Name = new string('n', RecurrenceScheduleValidation.NameMaxLength + 1),
                IsEnabled = true,
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RecurrenceScheduleValidation.NameMaxLength.ToString());
    }

    [Fact]
    public void ValidateUpdateRecurrenceSchedule_rejects_overlong_name()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule(
            new UpdateArchitectureReviewRecurrenceScheduleRequest
            {
                Name = new string('n', RecurrenceScheduleValidation.NameMaxLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RecurrenceScheduleValidation.NameMaxLength.ToString());
    }

    [Fact]
    public void ValidateUpdateRecurrenceSchedule_rejects_overlong_cron_expression()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule(
            new UpdateArchitectureReviewRecurrenceScheduleRequest
            {
                CronExpression = new string('0', RecurrenceScheduleValidation.CronExpressionMaxLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RecurrenceScheduleValidation.CronExpressionMaxLength.ToString());
    }

    [Fact]
    public void ValidateCreateRecurrenceSchedule_rejects_invalid_cron_expression()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule(
            new CreateArchitectureReviewRecurrenceScheduleRequest
            {
                SourceRunId = Guid.NewGuid(),
                CronExpression = "not-a-real-cron",
                IsEnabled = true,
            },
            _ => false);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Be(RecurrenceScheduleCronValidation.InvalidCronMessage);
    }

    [Fact]
    public void ValidateUpsertRealizedValueAttestation_rejects_negative_attested_incidents()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpsertRealizedValueAttestation(
            new UpsertRealizedValueAttestationRequest
            {
                AttestedIncidentsAvoided = -1,
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("non-negative");
    }

    [Fact]
    public void ValidateUpsertRealizedValueAttestation_rejects_whitespace_reviewer_note()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpsertRealizedValueAttestation(
            new UpsertRealizedValueAttestationRequest
            {
                AttestedReviewerTimeSavedNote = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateUpdateRecurrenceSchedule_rejects_whitespace_only_name()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule(
            new UpdateArchitectureReviewRecurrenceScheduleRequest
            {
                Name = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateUpdateRecurrenceSchedule_rejects_whitespace_only_cron_expression()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule(
            new UpdateArchitectureReviewRecurrenceScheduleRequest
            {
                CronExpression = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateUpsertRealizedValueAttestation_rejects_overlong_reviewer_note()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateUpsertRealizedValueAttestation(
            new UpsertRealizedValueAttestationRequest
            {
                AttestedReviewerTimeSavedNote = new string('n', RealizedValueAttestationUpsertValidation.NoteMaxLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RealizedValueAttestationUpsertValidation.NoteMaxLength.ToString());
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_deferred_without_revisit_due()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Deferred,
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("Revisit due date is required");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_deferred_with_past_revisit_due()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Deferred,
                RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(-1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("future");
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_deferred_without_revisit_due()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Deferred,
                Rationale = "defer until next quarter",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("Revisit due date is required");
    }

    [Fact]
    public void ValidateRecordDisposition_rejects_overlong_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRecordDisposition(
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Accepted,
                Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
                TradeOffAcknowledgment = "accepted after architecture board review",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MaximumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_overlong_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Accepted,
                Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MaximumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_optional_evidence_request_text_on_non_needs_evidence_disposition()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Remediated,
                Rationale = "bulk remediated with enough chars",
                EvidenceRequestText = "please provide staging evidence logs",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("evidenceRequestText");
        validation.Message.Should().Contain("not applicable");
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_whitespace_only_optional_evidence_request_text()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Remediated,
                Rationale = "bulk remediated with enough chars",
                EvidenceRequestText = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("evidenceRequestText");
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_whitespace_only_trade_off_acknowledgment_on_accepted()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Accepted,
                Rationale = "accepting residual risk with rationale",
                TradeOffAcknowledgment = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("tradeOffAcknowledgment");
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_revisit_due_on_non_deferred_disposition()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Remediated,
                Rationale = "bulk remediated with enough chars",
                RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("revisitDueUtc");
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_optional_trade_off_acknowledgment_on_non_accepted_disposition()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Remediated,
                Rationale = "bulk remediated with enough chars",
                TradeOffAcknowledgment = "accepting latency trade-off for lower cost",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("tradeOffAcknowledgment");
        validation.Message.Should().Contain("not applicable");
    }

    [Fact]
    public void ValidateBulkDisposition_rejects_whitespace_only_optional_trade_off_acknowledgment()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Remediated,
                Rationale = "bulk remediated with enough chars",
                TradeOffAcknowledgment = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("tradeOffAcknowledgment");
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_rationale_shorter_than_minimum_length()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "too short",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MinimumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_overlong_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MaximumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateRenewRiskException_rejects_rationale_shorter_than_minimum_length()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRenewRiskException(
            new RenewRiskExceptionRequest
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                Rationale = "too short",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MinimumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateRenewRiskException_rejects_overlong_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRenewRiskException(
            new RenewRiskExceptionRequest
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(FindingDispositionValidation.MaximumRationaleLength.ToString());
    }

    [Fact]
    public void ValidateRenewRiskException_rejects_whitespace_only_rationale()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRenewRiskException(
            new RenewRiskExceptionRequest
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                Rationale = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateRenewRiskException_rejects_whitespace_only_evidence_ref()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRenewRiskException(
            new RenewRiskExceptionRequest
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                EvidenceRef = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateRenewRiskException_rejects_overlong_evidence_ref()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRenewRiskException(
            new RenewRiskExceptionRequest
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(RiskExceptionValidation.EvidenceRefMaxLength.ToString());
    }

    [Fact]
    public void ValidateDecisionRegisterFilters_rejects_inverted_confidence_range()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: null,
            recordedAfterUtc: null,
            recordedBeforeUtc: null,
            minConfidence: 0.9,
            maxConfidence: 0.1,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("minConfidence");
    }

    [Fact]
    public void ValidateBuyerConfidenceSource_accepts_known_values()
    {
        GovernanceStickinessHttpMapper.ValidateBuyerConfidenceSource(BuyerDecisionConfidenceSource.EvidenceBacked)
            .Should()
            .BeNull();
    }

    [Fact]
    public void ValidateBuyerConfidenceSource_accepts_padded_known_label()
    {
        GovernanceStickinessHttpMapper.ValidateBuyerConfidenceSource($" {BuyerDecisionConfidenceSource.EvidenceBacked} ")
            .Should()
            .BeNull();
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(1.1)]
    public void ValidateDecisionRegisterFilters_rejects_out_of_range_confidence_bounds(double value)
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: null,
            recordedAfterUtc: null,
            recordedBeforeUtc: null,
            minConfidence: value < 0 ? value : null,
            maxConfidence: value > 1 ? value : null,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidateDecisionRegisterFilters_rejects_recorded_after_before_1970()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: null,
            recordedAfterUtc: new DateTimeOffset(1969, 12, 31, 23, 59, 59, TimeSpan.Zero),
            recordedBeforeUtc: null,
            minConfidence: null,
            maxConfidence: null,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("recordedAfterUtc");
    }

    [Fact]
    public void ValidateDecisionRegisterFilters_rejects_overlong_category()
    {
        string overlongCategory = new string('c', GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: overlongCategory,
            recordedAfterUtc: null,
            recordedBeforeUtc: null,
            minConfidence: null,
            maxConfidence: null,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength.ToString());
    }
}
