using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Request validation for governance stickiness HTTP routes.</summary>
public static class GovernanceStickinessHttpMapper
{
    public const int RegisterMaxRowsLimit = 500;

    public static GovernanceHttpValidation? ValidateRegisterMaxRows(int maxRows)
    {
        if (maxRows <= 0)
            return new GovernanceHttpValidation("maxRows must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxRows > RegisterMaxRowsLimit)
            return new GovernanceHttpValidation("maxRows must be at most 500.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateProjectQueryId(Guid? projectId)
    {
        if (GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId(projectId))
            return new GovernanceHttpValidation("projectId must not be empty.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateCreateRiskException(CreateRiskExceptionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.RunId is null || request.RunId == Guid.Empty)
            return new GovernanceHttpValidation("runId is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(request.FindingId))
            return new GovernanceHttpValidation("findingId is required.", ProblemTypes.ValidationFailed);

        string normalizedFindingId = request.FindingId.Trim();

        if (normalizedFindingId.Length > GovernanceRequestValidationRules.FindingIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"findingId must not exceed {GovernanceRequestValidationRules.FindingIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(request.OwnerUserId))
            return new GovernanceHttpValidation("ownerUserId is required.", ProblemTypes.ValidationFailed);

        string normalizedOwnerUserId = request.OwnerUserId.Trim();

        if (normalizedOwnerUserId.Length > RiskExceptionValidation.OwnerUserIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"ownerUserId must not exceed {RiskExceptionValidation.OwnerUserIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (request.EvidenceRef is not null)
        {
            string normalizedEvidenceRef = request.EvidenceRef.Trim();

            if (normalizedEvidenceRef.Length > RiskExceptionValidation.EvidenceRefMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"evidenceRef must not exceed {RiskExceptionValidation.EvidenceRefMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }
        }

        if (string.IsNullOrWhiteSpace(request.EvidenceRef))
            return new GovernanceHttpValidation("evidenceRef is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(request.Rationale))
            return new GovernanceHttpValidation("rationale is required.", ProblemTypes.ValidationFailed);

        string normalizedRationale = request.Rationale.Trim();

        if (normalizedRationale.Length < FindingDispositionValidation.MinimumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"rationale must be at least {FindingDispositionValidation.MinimumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (normalizedRationale.Length > FindingDispositionValidation.MaximumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"rationale must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        GovernanceHttpValidation? expiryValidation = ValidateRiskExceptionExpiry(request.ExpiresAtUtc);

        if (expiryValidation is not null)
            return expiryValidation;

        return null;
    }

    public static GovernanceHttpValidation? ValidateRenewRiskException(RenewRiskExceptionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Rationale is not null && string.IsNullOrWhiteSpace(request.Rationale))
        {
            return new GovernanceHttpValidation(
                "rationale cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (request.EvidenceRef is not null && string.IsNullOrWhiteSpace(request.EvidenceRef))
        {
            return new GovernanceHttpValidation(
                "evidenceRef cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (!string.IsNullOrWhiteSpace(request.Rationale))
        {
            string normalizedRationale = request.Rationale.Trim();

            if (normalizedRationale.Length < FindingDispositionValidation.MinimumRationaleLength)
            {
                return new GovernanceHttpValidation(
                    $"rationale must be at least {FindingDispositionValidation.MinimumRationaleLength} characters.",
                    ProblemTypes.ValidationFailed);
            }

            if (normalizedRationale.Length > FindingDispositionValidation.MaximumRationaleLength)
            {
                return new GovernanceHttpValidation(
                    $"rationale must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.",
                    ProblemTypes.ValidationFailed);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.EvidenceRef))
        {
            string normalizedEvidenceRef = request.EvidenceRef.Trim();

            if (normalizedEvidenceRef.Length > RiskExceptionValidation.EvidenceRefMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"evidenceRef must not exceed {RiskExceptionValidation.EvidenceRefMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }
        }

        GovernanceHttpValidation? expiryValidation = ValidateRiskExceptionExpiry(request.ExpiresAtUtc);

        if (expiryValidation is not null)
            return expiryValidation;

        return null;
    }

    public static GovernanceHttpValidation? ValidateCreateRecurrenceSchedule(
        CreateArchitectureReviewRecurrenceScheduleRequest request,
        Func<string, bool>? isSupportedCronExpression = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.SourceRunId == Guid.Empty)
            return new GovernanceHttpValidation("sourceRunId is required.", ProblemTypes.ValidationFailed);

        if (!request.IsEnabled.HasValue)
        {
            return new GovernanceHttpValidation(
                "isEnabled is required. Set true to activate recurring assessments or false to save paused.",
                ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new GovernanceHttpValidation(
                "name cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        string name = request.Name.Trim();

        if (name.Length > RecurrenceScheduleValidation.NameMaxLength)
        {
            return new GovernanceHttpValidation(
                $"name must not exceed {RecurrenceScheduleValidation.NameMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(request.CronExpression))
        {
            return new GovernanceHttpValidation(
                "cronExpression cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        string cronExpression = request.CronExpression.Trim();

        if (cronExpression.Length > RecurrenceScheduleValidation.CronExpressionMaxLength)
        {
            return new GovernanceHttpValidation(
                $"cronExpression must not exceed {RecurrenceScheduleValidation.CronExpressionMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        GovernanceHttpValidation? cronSyntaxValidation =
            ValidateCronExpressionSyntax(cronExpression, isSupportedCronExpression);

        if (cronSyntaxValidation is not null)
            return cronSyntaxValidation;

        return null;
    }

    public static GovernanceHttpValidation? ValidateUpdateRecurrenceSchedule(
        UpdateArchitectureReviewRecurrenceScheduleRequest request,
        Func<string, bool>? isSupportedCronExpression = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return new GovernanceHttpValidation(
                    "name cannot be empty or whitespace.",
                    ProblemTypes.ValidationFailed);
            }

            string name = request.Name.Trim();

            if (name.Length > RecurrenceScheduleValidation.NameMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"name must not exceed {RecurrenceScheduleValidation.NameMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }
        }

        if (request.CronExpression is not null)
        {
            if (string.IsNullOrWhiteSpace(request.CronExpression))
            {
                return new GovernanceHttpValidation(
                    "cronExpression cannot be empty or whitespace.",
                    ProblemTypes.ValidationFailed);
            }

            string cronExpression = request.CronExpression.Trim();

            if (cronExpression.Length > RecurrenceScheduleValidation.CronExpressionMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"cronExpression must not exceed {RecurrenceScheduleValidation.CronExpressionMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }

            GovernanceHttpValidation? cronSyntaxValidation =
                ValidateCronExpressionSyntax(cronExpression, isSupportedCronExpression);

            if (cronSyntaxValidation is not null)
                return cronSyntaxValidation;
        }

        return null;
    }

    private static GovernanceHttpValidation? ValidateCronExpressionSyntax(
        string cronExpression,
        Func<string, bool>? isSupportedCronExpression)
    {
        if (isSupportedCronExpression is null)
            return null;

        if (!isSupportedCronExpression(cronExpression))
        {
            return new GovernanceHttpValidation(
                RecurrenceScheduleCronValidation.InvalidCronMessage,
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateUpsertRealizedValueAttestation(
        UpsertRealizedValueAttestationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.AttestedIncidentsAvoided is < 0)
        {
            return new GovernanceHttpValidation(
                "AttestedIncidentsAvoided must be non-negative.",
                ProblemTypes.ValidationFailed);
        }

        GovernanceHttpValidation? revenueImpactValidation =
            ValidateOptionalAttestationNoteLength(
                request.AttestedRevenueOrRetentionImpact,
                nameof(request.AttestedRevenueOrRetentionImpact));

        if (revenueImpactValidation is not null)
            return revenueImpactValidation;

        GovernanceHttpValidation? reviewerNoteValidation =
            ValidateOptionalAttestationNoteLength(
                request.AttestedReviewerTimeSavedNote,
                nameof(request.AttestedReviewerTimeSavedNote));

        if (reviewerNoteValidation is not null)
            return reviewerNoteValidation;

        return null;
    }

    public static GovernanceHttpValidation? ValidateRecordDisposition(RecordFindingDispositionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        GovernanceHttpValidation? dispositionValidation = ValidateDispositionEnum(request.Disposition);

        if (dispositionValidation is not null)
            return dispositionValidation;

        bool requiresRationale = request.Disposition is FindingDisposition.Accepted
            or FindingDisposition.RejectedAsNotApplicable;

        if (requiresRationale)
        {
            GovernanceHttpValidation? rationaleValidation =
                ValidateRequiredDispositionText(request.Rationale, "rationale");

            if (rationaleValidation is not null)
                return rationaleValidation;
        }
        else
        {
            GovernanceHttpValidation? rationaleValidation =
                ValidateOptionalDispositionTextMaxLength(request.Rationale, "rationale");

            if (rationaleValidation is not null)
                return rationaleValidation;
        }

        if (request.Disposition == FindingDisposition.Accepted)
        {
            GovernanceHttpValidation? tradeOffValidation =
                ValidateRequiredDispositionText(request.TradeOffAcknowledgment, "tradeOffAcknowledgment");

            if (tradeOffValidation is not null)
                return tradeOffValidation;
        }

        if (request.Disposition == FindingDisposition.NeedsEvidence)
        {
            if (string.IsNullOrWhiteSpace(request.EvidenceRequestText))
            {
                return new GovernanceHttpValidation(
                    "evidenceRequestText is required.",
                    ProblemTypes.ValidationFailed);
            }

            GovernanceHttpValidation? evidenceValidation =
                ValidateOptionalDispositionTextMaxLength(request.EvidenceRequestText, "evidenceRequestText");

            if (evidenceValidation is not null)
                return evidenceValidation;
        }

        GovernanceHttpValidation? revisitValidation =
            ValidateDeferredRevisitDueUtc(request.Disposition, request.RevisitDueUtc);

        if (revisitValidation is not null)
            return revisitValidation;

        GovernanceHttpValidation? optionalEvidenceValidation =
            ValidateOptionalDispositionFieldWhenNotApplicable(
                request.EvidenceRequestText,
                "evidenceRequestText",
                request.Disposition == FindingDisposition.NeedsEvidence);

        if (optionalEvidenceValidation is not null)
            return optionalEvidenceValidation;

        GovernanceHttpValidation? optionalTradeOffValidation =
            ValidateOptionalDispositionFieldWhenNotApplicable(
                request.TradeOffAcknowledgment,
                "tradeOffAcknowledgment",
                request.Disposition == FindingDisposition.Accepted);

        if (optionalTradeOffValidation is not null)
            return optionalTradeOffValidation;

        GovernanceHttpValidation? optionalRevisitValidation =
            ValidateOptionalDispositionDateWhenNotApplicable(
                request.RevisitDueUtc,
                "revisitDueUtc",
                request.Disposition == FindingDisposition.Deferred);

        if (optionalRevisitValidation is not null)
            return optionalRevisitValidation;

        return null;
    }

    public static GovernanceHttpValidation? ValidateRecordDispositionRouteFindingId(
        string routeFindingId,
        RecordFindingDispositionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string bodyFindingId = request.FindingId?.Trim() ?? "";

        if (!string.Equals(routeFindingId, bodyFindingId, StringComparison.Ordinal))
        {
            return new GovernanceHttpValidation(
                "findingId must match the route findingId.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateBulkDisposition(RecordBulkFindingDispositionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        GovernanceHttpValidation? dispositionValidation = ValidateDispositionEnum(request.Disposition);

        if (dispositionValidation is not null)
            return dispositionValidation;

        GovernanceHttpValidation? rationaleValidation =
            ValidateRequiredDispositionText(request.Rationale, "rationale");

        if (rationaleValidation is not null)
            return rationaleValidation;

        if (request.Disposition == FindingDisposition.Accepted
            && request.TradeOffAcknowledgment is not null)
        {
            GovernanceHttpValidation? tradeOffValidation =
                ValidateRequiredDispositionText(request.TradeOffAcknowledgment, "tradeOffAcknowledgment");

            if (tradeOffValidation is not null)
                return tradeOffValidation;
        }

        if (request.Disposition == FindingDisposition.NeedsEvidence)
        {
            if (string.IsNullOrWhiteSpace(request.EvidenceRequestText))
            {
                return new GovernanceHttpValidation(
                    "evidenceRequestText is required.",
                    ProblemTypes.ValidationFailed);
            }

            GovernanceHttpValidation? evidenceValidation =
                ValidateOptionalDispositionTextMaxLength(request.EvidenceRequestText, "evidenceRequestText");

            if (evidenceValidation is not null)
                return evidenceValidation;
        }

        GovernanceHttpValidation? revisitValidation =
            ValidateDeferredRevisitDueUtc(request.Disposition, request.RevisitDueUtc);

        if (revisitValidation is not null)
            return revisitValidation;

        GovernanceHttpValidation? optionalEvidenceValidation =
            ValidateOptionalDispositionFieldWhenNotApplicable(
                request.EvidenceRequestText,
                "evidenceRequestText",
                request.Disposition == FindingDisposition.NeedsEvidence);

        if (optionalEvidenceValidation is not null)
            return optionalEvidenceValidation;

        GovernanceHttpValidation? optionalTradeOffValidation =
            ValidateOptionalDispositionFieldWhenNotApplicable(
                request.TradeOffAcknowledgment,
                "tradeOffAcknowledgment",
                request.Disposition == FindingDisposition.Accepted);

        if (optionalTradeOffValidation is not null)
            return optionalTradeOffValidation;

        GovernanceHttpValidation? optionalRevisitValidation =
            ValidateOptionalDispositionDateWhenNotApplicable(
                request.RevisitDueUtc,
                "revisitDueUtc",
                request.Disposition == FindingDisposition.Deferred);

        if (optionalRevisitValidation is not null)
            return optionalRevisitValidation;

        return null;
    }

    private static GovernanceHttpValidation? ValidateDeferredRevisitDueUtc(
        FindingDisposition disposition,
        DateTimeOffset? revisitDueUtc)
    {
        if (disposition != FindingDisposition.Deferred)
            return null;

        if (revisitDueUtc is null)
        {
            return new GovernanceHttpValidation(
                "Revisit due date is required when deferring.",
                ProblemTypes.ValidationFailed);
        }

        DateTimeOffset effectiveNowUtc = TimeProvider.System.GetUtcNow();

        if (revisitDueUtc <= effectiveNowUtc)
        {
            return new GovernanceHttpValidation(
                "Revisit due date must be in the future when deferring.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static GovernanceHttpValidation? ValidateOptionalAttestationNoteLength(string? value, string fieldName)
    {
        if (value is null)
            return null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return new GovernanceHttpValidation(
                $"{fieldName} cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (value.Trim().Length > RealizedValueAttestationUpsertValidation.NoteMaxLength)
        {
            return new GovernanceHttpValidation(
                $"{fieldName} must be at most {RealizedValueAttestationUpsertValidation.NoteMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static GovernanceHttpValidation? ValidateRequiredDispositionText(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return new GovernanceHttpValidation($"{fieldName} is required.", ProblemTypes.ValidationFailed);

        string normalized = value.Trim();

        if (normalized.Length < FindingDispositionValidation.MinimumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"{fieldName} must be at least {FindingDispositionValidation.MinimumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (normalized.Length > FindingDispositionValidation.MaximumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"{fieldName} must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static GovernanceHttpValidation? ValidateOptionalDispositionTextMaxLength(string? value, string fieldName)
    {
        if (value is null)
            return null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return new GovernanceHttpValidation(
                $"{fieldName} cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (value.Trim().Length > FindingDispositionValidation.MaximumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"{fieldName} must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static GovernanceHttpValidation? ValidateOptionalDispositionFieldWhenNotApplicable(
        string? value,
        string fieldName,
        bool fieldApplies)
    {
        if (value is null || fieldApplies)
            return null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return new GovernanceHttpValidation(
                $"{fieldName} cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        return new GovernanceHttpValidation(
            $"{fieldName} is not applicable for this disposition.",
            ProblemTypes.ValidationFailed);
    }

    private static GovernanceHttpValidation? ValidateOptionalDispositionDateWhenNotApplicable(
        DateTimeOffset? value,
        string fieldName,
        bool fieldApplies)
    {
        if (value is null || fieldApplies)
            return null;

        return new GovernanceHttpValidation(
            $"{fieldName} is not applicable for this disposition.",
            ProblemTypes.ValidationFailed);
    }

    private static GovernanceHttpValidation? ValidateDispositionEnum(FindingDisposition disposition)
    {
        if (!Enum.IsDefined(disposition))
        {
            return new GovernanceHttpValidation(
                "disposition is not valid.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateResolveFindingMergeConflict(
        ResolveFindingMergeConflictRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return ValidateMergeConflictResolutionAction(request.Action);
    }

    private static GovernanceHttpValidation? ValidateMergeConflictResolutionAction(
        FindingMergeConflictResolutionAction action)
    {
        if (!Enum.IsDefined(action))
        {
            return new GovernanceHttpValidation(
                "action is not valid.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateRouteGuid(Guid id, string parameterName)
    {
        if (id == Guid.Empty)
            return new GovernanceHttpValidation($"{parameterName} is required.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateDecisionRegisterFilters(
        string? category,
        DateTimeOffset? recordedAfterUtc,
        DateTimeOffset? recordedBeforeUtc,
        double? minConfidence,
        double? maxConfidence,
        string? buyerConfidenceSource)
    {
        if (category is not null && string.IsNullOrWhiteSpace(category))
        {
            return new GovernanceHttpValidation(
                "category cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (category is not null && category.Trim().Length > GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength)
        {
            return new GovernanceHttpValidation(
                $"category must not exceed {GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (recordedAfterUtc is not null
            && recordedBeforeUtc is not null
            && recordedAfterUtc > recordedBeforeUtc)
        {
            return new GovernanceHttpValidation(
                "recordedAfterUtc must be on or before recordedBeforeUtc.",
                ProblemTypes.ValidationFailed);
        }

        if (recordedAfterUtc is not null && recordedAfterUtc.Value.Year < 1970)
        {
            return new GovernanceHttpValidation(
                "recordedAfterUtc must be on or after 1970-01-01.",
                ProblemTypes.ValidationFailed);
        }

        if (recordedBeforeUtc is not null && recordedBeforeUtc.Value.Year < 1970)
        {
            return new GovernanceHttpValidation(
                "recordedBeforeUtc must be on or after 1970-01-01.",
                ProblemTypes.ValidationFailed);
        }

        if (minConfidence is not null && maxConfidence is not null && minConfidence > maxConfidence)
        {
            return new GovernanceHttpValidation(
                "minConfidence must be less than or equal to maxConfidence.",
                ProblemTypes.ValidationFailed);
        }

        GovernanceHttpValidation? minConfidenceValidation = ValidateConfidenceBound(minConfidence, "minConfidence");

        if (minConfidenceValidation is not null)
            return minConfidenceValidation;

        GovernanceHttpValidation? maxConfidenceValidation = ValidateConfidenceBound(maxConfidence, "maxConfidence");

        if (maxConfidenceValidation is not null)
            return maxConfidenceValidation;

        return ValidateBuyerConfidenceSource(buyerConfidenceSource);
    }

    private static GovernanceHttpValidation? ValidateConfidenceBound(double? confidence, string parameterName)
    {
        if (confidence is null)
            return null;

        if (confidence < 0 || confidence > 1)
        {
            return new GovernanceHttpValidation(
                $"{parameterName} must be between 0 and 1.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateBuyerConfidenceSource(string? buyerConfidenceSource)
    {
        if (buyerConfidenceSource is null)
            return null;

        string normalizedBuyerConfidenceSource = buyerConfidenceSource.Trim();

        if (string.IsNullOrWhiteSpace(normalizedBuyerConfidenceSource))
        {
            return new GovernanceHttpValidation(
                "buyerConfidenceSource cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (!IsKnownBuyerConfidenceSource(normalizedBuyerConfidenceSource))
        {
            return new GovernanceHttpValidation(
                $"buyerConfidenceSource must be one of: {BuyerDecisionConfidenceSource.EvidenceBacked}, {BuyerDecisionConfidenceSource.ModelAssisted}, or {BuyerDecisionConfidenceSource.Unknown}.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static bool IsKnownBuyerConfidenceSource(string buyerConfidenceSource) =>
        string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.EvidenceBacked, StringComparison.OrdinalIgnoreCase)
        || string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.ModelAssisted, StringComparison.OrdinalIgnoreCase)
        || string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.Unknown, StringComparison.OrdinalIgnoreCase);

    private static GovernanceHttpValidation? ValidateRiskExceptionExpiry(DateTimeOffset expiresAtUtc)
    {
        DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();

        if (expiresAtUtc <= nowUtc)
        {
            return new GovernanceHttpValidation(
                "Expiration must be in the future.",
                ProblemTypes.ValidationFailed);
        }

        DateTimeOffset maxExpiry = nowUtc.AddDays(RiskExceptionValidation.MaxDurationDays);

        if (expiresAtUtc > maxExpiry)
        {
            return new GovernanceHttpValidation(
                $"Waiver duration cannot exceed {RiskExceptionValidation.MaxDurationDays} days.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
