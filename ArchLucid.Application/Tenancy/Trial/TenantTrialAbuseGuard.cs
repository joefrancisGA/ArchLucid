using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Tenancy.Trial;

/// <inheritdoc cref="ITenantTrialAbuseGuard" />
public sealed class TenantTrialAbuseGuard(
    ITrialIdentityUserRepository trialIdentityUsers,
    ISelfServiceTrialAbuseRepository trialAbuseRepository) : ITenantTrialAbuseGuard
{
    private readonly ITrialIdentityUserRepository _trialIdentityUsers =
        trialIdentityUsers ?? throw new ArgumentNullException(nameof(trialIdentityUsers));

    private readonly ISelfServiceTrialAbuseRepository _trialAbuseRepository =
        trialAbuseRepository ?? throw new ArgumentNullException(nameof(trialAbuseRepository));

    public async Task<TenantTrialIdentityLinkPrecheckResult> ValidateIdentityLinkAsync(
        TenantTrialLinkEntraBody body,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        bool hasEmail = !string.IsNullOrWhiteSpace(body.LocalEmail);
        bool hasOid = !string.IsNullOrWhiteSpace(body.EntraOid);

        if (!hasEmail && !hasOid)
        {
            return new TenantTrialIdentityLinkPrecheckResult { HasIdentityPayload = false };
        }

        string normalizedLocal = TrialEmailNormalizer.Normalize(body.LocalEmail!);
        TrialIdentityUserRecord? localRow =
            await _trialIdentityUsers.GetByNormalizedEmailAsync(normalizedLocal, cancellationToken).ConfigureAwait(false);

        if (localRow is null)
        {
            return Failure(
                TenantTrialHttpOutcome.ValidationFailed,
                "No local trial identity exists for that email.");
        }

        bool emailClaimedForTenant = await _trialAbuseRepository.HasEmailClaimForTenantAsync(
            normalizedLocal,
            tenantId,
            cancellationToken).ConfigureAwait(false);

        if (!emailClaimedForTenant)
        {
            return Failure(
                TenantTrialHttpOutcome.ValidationFailed,
                "No local trial identity exists for that email.");
        }

        string requestedOid = body.EntraOid!.Trim();

        if (!TrialEntraOidValidation.TryValidateLength(requestedOid, out string? entraOidError))
        {
            return Failure(TenantTrialHttpOutcome.ValidationFailed, entraOidError!);
        }

        if (localRow.LinkedEntraOid is { } existingLinkedOid && existingLinkedOid != requestedOid)
        {
            return Failure(
                TenantTrialHttpOutcome.Conflict,
                "That local identity is already linked to a different Entra user id.");
        }

        return new TenantTrialIdentityLinkPrecheckResult
        {
            NormalizedLocalEmail = normalizedLocal,
            HasIdentityPayload = true,
        };
    }

    private static TenantTrialIdentityLinkPrecheckResult Failure(TenantTrialHttpOutcome outcome, string message) =>
        new()
        {
            Failure = new TenantTrialLinkEntraResult
            {
                Outcome = outcome,
                Message = message,
            },
        };
}
