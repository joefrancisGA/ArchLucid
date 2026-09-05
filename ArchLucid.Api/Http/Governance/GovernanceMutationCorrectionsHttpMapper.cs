using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Request validation for governance mutation-correction HTTP routes.</summary>
public static class GovernanceMutationCorrectionsHttpMapper
{
    public static GovernanceHttpValidation? ValidateRecordMutationCorrection(
        RecordGovernanceMutationCorrectionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string mutationKind = request.MutationKind?.Trim() ?? string.Empty;

        if (!GovernanceMutationCorrectionKinds.IsSupported(mutationKind))
        {
            return new GovernanceHttpValidation(
                $"Mutation kind '{mutationKind}' does not support in-product correction.",
                ProblemTypes.ValidationFailed);
        }

        GovernanceHttpValidation? runIdValidation =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRouteRunId(request.RunId);

        if (runIdValidation is not null)
            return runIdValidation;

        if (string.IsNullOrWhiteSpace(request.SubjectId))
            return new GovernanceHttpValidation("Subject id is required.", ProblemTypes.ValidationFailed);

        string normalizedSubjectId = request.SubjectId.Trim();

        if (normalizedSubjectId.Length > GovernanceRequestValidationRules.FindingIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"Subject id must not exceed {GovernanceRequestValidationRules.FindingIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(request.Rationale))
        {
            return new GovernanceHttpValidation(
                "Rationale is required to record a correction.",
                ProblemTypes.ValidationFailed);
        }

        string normalizedRationale = request.Rationale.Trim();

        if (normalizedRationale.Length < FindingDispositionValidation.MinimumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"Rationale must be at least {FindingDispositionValidation.MinimumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (normalizedRationale.Length > FindingDispositionValidation.MaximumRationaleLength)
        {
            return new GovernanceHttpValidation(
                $"Rationale must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
