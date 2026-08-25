using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

internal static class PostAuthBootstrapSupport
{
    internal const string InvitationLabel = "Organization workspace";

    internal static bool IsResumePath(string? safeReturnPath) =>
        !string.IsNullOrWhiteSpace(safeReturnPath) && safeReturnPath != "/";

    internal static string? ExtractDomain(string normalizedEmail)
    {
        int at = normalizedEmail.IndexOf('@');

        if (at <= 0 || at == normalizedEmail.Length - 1)
        {
            return null;
        }

        return normalizedEmail[(at + 1)..];
    }

    internal static PostAuthBootstrapInvitationSummary BuildInvitationSummary(
        UserInvitationRecord invitation,
        string authenticatedEmail,
        bool emailMismatch) =>
        new()
        {
            InvitationId = invitation.Id,
            Label = InvitationLabel,
            MaskedInvitedEmail = MaskEmail(invitation.Email),
            RequiresEmailMismatchConfirmation = emailMismatch,
            ConfirmationMessage = emailMismatch
                ? $"This invitation was sent to {MaskEmail(invitation.Email)}. You are signed in as {MaskEmail(authenticatedEmail)}. Confirm to join."
                : null
        };

    internal static string MaskEmail(string normalizedEmail)
    {
        int at = normalizedEmail.IndexOf('@');

        if (at <= 1)
        {
            return "***";
        }

        string local = normalizedEmail[..at];
        string domain = normalizedEmail[(at + 1)..];
        string maskedLocal = local.Length <= 2
            ? $"{local[0]}*"
            : $"{local[0]}***{local[^1]}";

        return $"{maskedLocal}@{domain}";
    }

    internal static async Task<IReadOnlyList<WorkspaceMembershipRecord>> ListActiveMembershipsAsync(
        IWorkspaceMembershipRepository memberships,
        Guid platformUserId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> rows =
            await memberships.ListByUserIdAsync(platformUserId, cancellationToken).ConfigureAwait(false);

        return rows.Where(row => row.Status == WorkspaceMembershipStatus.Active).ToList();
    }

    internal static async Task<List<PostAuthBootstrapWorkspaceSummary>> BuildWorkspaceSummariesAsync(
        ITenantRepository tenantRepository,
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships,
        CancellationToken cancellationToken)
    {
        List<PostAuthBootstrapWorkspaceSummary> summaries = [];

        foreach (WorkspaceMembershipRecord membership in activeMemberships)
        {
            IReadOnlyList<TenantWorkspaceListItem> workspaces =
                await tenantRepository.ListWorkspacesAsync(membership.TenantId, cancellationToken).ConfigureAwait(false);

            TenantWorkspaceListItem? workspace =
                workspaces.FirstOrDefault(row => row.WorkspaceId == membership.WorkspaceId);

            summaries.Add(
                new PostAuthBootstrapWorkspaceSummary
                {
                    TenantId = membership.TenantId,
                    WorkspaceId = membership.WorkspaceId,
                    WorkspaceName = workspace?.Name ?? "Workspace"
                });
        }

        return summaries;
    }
}
