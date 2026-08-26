using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class PostAuthWorkspaceBootstrapService
{
    public async Task<PostAuthBootstrapStatusResult> ResolveWorkspaceStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? safeReturnPath,
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships,
        CancellationToken cancellationToken)
    {
        if (activeMemberships.Count > 1)
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.SelectWorkspace,
                Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                        _tenantRepository,
                        activeMemberships,
                        cancellationToken)
                    .ConfigureAwait(false),
                CanCreateWorkspace = false
            };
        }

        if (activeMemberships.Count == 1)
        {
            if (PostAuthBootstrapSupport.IsResumePath(safeReturnPath))
            {
                return new PostAuthBootstrapStatusResult
                {
                    Destination = PostAuthBootstrapDestination.ResumeWorkflow,
                    ResumePath = safeReturnPath,
                    Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                            _tenantRepository,
                            activeMemberships,
                            cancellationToken)
                        .ConfigureAwait(false),
                    CanCreateWorkspace = false
                };
            }

            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.Complete,
                Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                        _tenantRepository,
                        activeMemberships,
                        cancellationToken)
                    .ConfigureAwait(false),
                CanCreateWorkspace = false
            };
        }

        PostAuthBootstrapDuplicateOrganizationHint duplicateHint =
            await EvaluateDuplicateOrganizationHintAsync(normalizedEmail, null, cancellationToken).ConfigureAwait(false);

        bool canCreate = !duplicateHint.AccessRequestRecommended
            && !await HasActiveOwnedTrialAsync(platformUserId, cancellationToken).ConfigureAwait(false);

        if (!canCreate && duplicateHint.AccessRequestRecommended)
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.NoAccess,
                DuplicateOrganization = duplicateHint,
                CanCreateWorkspace = false,
                DenialReason = duplicateHint.CustomerMessage
            };
        }

        if (!canCreate)
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.NoAccess,
                CanCreateWorkspace = false,
                DenialReason = ActiveTrialDenialMessage
            };
        }

        if (PostAuthBootstrapSupport.IsResumePath(safeReturnPath))
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.ResumeWorkflow,
                ResumePath = safeReturnPath,
                DuplicateOrganization = duplicateHint,
                CanCreateWorkspace = true
            };
        }

        return new PostAuthBootstrapStatusResult
        {
            Destination = PostAuthBootstrapDestination.CreateWorkspace,
            DuplicateOrganization = duplicateHint,
            CanCreateWorkspace = true
        };
    }

    private async Task<bool> HasActiveOwnedTrialAsync(Guid platformUserId, CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> memberships =
            await PostAuthBootstrapSupport.ListActiveMembershipsAsync(_memberships, platformUserId, cancellationToken)
                .ConfigureAwait(false);

        foreach (WorkspaceMembershipRecord membership in memberships)
        {
            if (!string.Equals(membership.Role, ArchLucidRoles.WorkspaceAdmin, StringComparison.Ordinal)
                && !string.Equals(membership.Role, ArchLucidRoles.Admin, StringComparison.Ordinal))
            {
                continue;
            }

            TenantRecord? tenant =
                await _tenantRepository.GetByIdAsync(membership.TenantId, cancellationToken).ConfigureAwait(false);

            if (tenant is not null
                && string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private async Task<PostAuthBootstrapDuplicateOrganizationHint> EvaluateDuplicateOrganizationHintAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        EmailOtpSignInDomainEvaluation domainEvaluation =
            await _domainPolicy.EvaluateAsync(normalizedEmail, invitationToken, cancellationToken).ConfigureAwait(false);

        if (domainEvaluation.Decision == EmailOtpSignInDomainDecision.RequireEnterpriseSso)
        {
            return new PostAuthBootstrapDuplicateOrganizationHint
            {
                Detected = true,
                AccessRequestRecommended = true,
                CustomerMessage = DuplicateOrgMessage
            };
        }

        return new PostAuthBootstrapDuplicateOrganizationHint
        {
            Detected = false,
            AccessRequestRecommended = false,
            CustomerMessage = string.Empty
        };
    }
}
