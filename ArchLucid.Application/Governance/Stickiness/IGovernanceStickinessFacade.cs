using ArchLucid.Application.Findings;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Stickiness;

/// <summary>
///     Application workflow facade for governance stickiness HTTP routes: risk/decision registers, dispositions,
///     waivers, recurrence schedules, and realized-value attestation.
/// </summary>
public interface IGovernanceStickinessFacade
{
    Task<ArchitectureRiskRegisterResponse> GetRiskRegisterAsync(
        Guid? projectId,
        int maxRows,
        bool assignedToMe,
        CancellationToken ct);

    Task<int> GetAssignedToMeFindingsCountAsync(Guid? projectId, CancellationToken ct);

    Task<GovernanceReviewsAwaitingActionResponse> GetReviewsAwaitingActionAsync(CancellationToken ct);

    Task<GovernanceDecisionsNeededSummaryResponse> GetDecisionsNeededSummaryAsync(
        Guid? projectId,
        CancellationToken ct);

    Task<GovernanceFindingsRegistersBundleResponse> GetFindingsRegistersBundleAsync(
        Guid? projectId,
        int maxRows,
        CancellationToken ct);

    Task<ArchitectureDecisionRegisterResponse> GetDecisionRegisterAsync(
        Guid? projectId,
        int maxRows,
        ArchitectureDecisionRegisterQueryOptions filters,
        CancellationToken ct);

    Task<FindingDispositionEventDto> RecordDispositionAsync(
        RecordFindingDispositionRequest request,
        CancellationToken ct);

    Task<RecordBulkFindingDispositionResponse> RecordBulkDispositionAsync(
        RecordBulkFindingDispositionRequest request,
        CancellationToken ct);

    Task<IReadOnlyList<FindingDispositionEventDto>> ListDispositionsAsync(
        string findingId,
        CancellationToken ct);

    Task<RiskExceptionRecord> CreateRiskExceptionAsync(
        CreateRiskExceptionRequest request,
        CancellationToken ct);

    Task<IReadOnlyList<RiskExceptionRecord>> ListRiskExceptionsAsync(
        Guid? projectId,
        CancellationToken ct);

    Task RevokeRiskExceptionAsync(Guid riskExceptionId, CancellationToken ct);

    Task<RiskExceptionRecord> RenewRiskExceptionAsync(
        Guid riskExceptionId,
        RenewRiskExceptionRequest request,
        CancellationToken ct);

    Task<ArchitectureReviewRecurrenceSchedule> CreateRecurrenceScheduleAsync(
        CreateArchitectureReviewRecurrenceScheduleRequest request,
        CancellationToken ct);

    Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListRecurrenceSchedulesAsync(CancellationToken ct);

    PreviewRecurrenceScheduleRunsResponse PreviewRecurrenceScheduleRuns(
        PreviewRecurrenceScheduleRunsRequest request);

    Task<RecurrenceScheduleUpdateResult> UpdateRecurrenceScheduleAsync(
        Guid scheduleId,
        UpdateArchitectureReviewRecurrenceScheduleRequest request,
        CancellationToken ct);

    Task<RealizedValueAttestationResponse> GetRealizedValueAttestationAsync(CancellationToken ct);

    Task UpsertRealizedValueAttestationAsync(
        UpsertRealizedValueAttestationRequest request,
        CancellationToken ct);

    Task<bool> TryResolveFindingMergeConflictAsync(
        Guid runId,
        string findingId,
        ArchLucid.Contracts.Findings.ResolveFindingMergeConflictRequest request,
        CancellationToken ct);
}
