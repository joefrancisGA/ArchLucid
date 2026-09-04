using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;

namespace ArchLucid.Api.Http.Tenancy;

/// <summary>Request validation for tenant erasure legal-hold HTTP routes.</summary>
internal static class TenantErasureLegalHoldHttpMapper
{
    internal const int LegalHoldReasonMaxLength = 500;

    internal static GovernanceHttpValidation? ValidateSetLegalHold(
        TenantErasureLegalHoldRequest request,
        TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(timeProvider);

        if (request.UntilUtc <= timeProvider.GetUtcNow())
        {
            return new GovernanceHttpValidation(
                "UntilUtc must be in the future.",
                ProblemTypes.ValidationFailed);
        }

        if (request.Reason is null)
            return null;

        string legalHoldReason = request.Reason.Trim();

        if (string.IsNullOrWhiteSpace(legalHoldReason))
        {
            return new GovernanceHttpValidation(
                "Reason cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (legalHoldReason.Length > LegalHoldReasonMaxLength)
        {
            return new GovernanceHttpValidation(
                $"Reason must be at most {LegalHoldReasonMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
