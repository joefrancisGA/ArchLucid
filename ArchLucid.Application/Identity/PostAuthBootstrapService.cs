using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public interface IPostAuthBootstrapService
{
    Task<PostAuthBootstrapStatusResult> ResolveStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? safeReturnPath,
        string? invitationToken,
        CancellationToken cancellationToken);

    Task<PostAuthCreateWorkspaceResult> CreateWorkspaceAsync(
        Guid platformUserId,
        string normalizedEmail,
        string displayEmail,
        PostAuthCreateWorkspaceRequest request,
        CancellationToken cancellationToken);

    Task<PostAuthBootstrapSessionResult?> AcceptInvitationAsync(
        Guid platformUserId,
        string normalizedEmail,
        PostAuthAcceptInvitationRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken);

    Task<PostAuthBootstrapSessionResult?> SelectWorkspaceAsync(
        Guid platformUserId,
        PostAuthSelectWorkspaceRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken);
}

public sealed class PostAuthBootstrapService(
    IWorkspaceMembershipRepository memberships,
    IPostAuthInvitationBootstrapService invitationBootstrap,
    IPostAuthWorkspaceBootstrapService workspaceBootstrap) : IPostAuthBootstrapService
{
    private readonly IPostAuthInvitationBootstrapService _invitationBootstrap =
        invitationBootstrap ?? throw new ArgumentNullException(nameof(invitationBootstrap));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly IPostAuthWorkspaceBootstrapService _workspaceBootstrap =
        workspaceBootstrap ?? throw new ArgumentNullException(nameof(workspaceBootstrap));

    public async Task<PostAuthBootstrapStatusResult> ResolveStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? safeReturnPath,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships =
            await PostAuthBootstrapSupport.ListActiveMembershipsAsync(_memberships, platformUserId, cancellationToken)
                .ConfigureAwait(false);

        PostAuthBootstrapStatusResult? invitationStatus = await _invitationBootstrap.TryResolveInvitationStatusAsync(
                platformUserId,
                normalizedEmail,
                invitationToken,
                activeMemberships,
                cancellationToken)
            .ConfigureAwait(false);

        if (invitationStatus is not null)
        {
            return invitationStatus;
        }

        return await _workspaceBootstrap.ResolveWorkspaceStatusAsync(
                platformUserId,
                normalizedEmail,
                safeReturnPath,
                activeMemberships,
                cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<PostAuthCreateWorkspaceResult> CreateWorkspaceAsync(
        Guid platformUserId,
        string normalizedEmail,
        string displayEmail,
        PostAuthCreateWorkspaceRequest request,
        CancellationToken cancellationToken) =>
        _workspaceBootstrap.CreateWorkspaceAsync(
            platformUserId,
            normalizedEmail,
            displayEmail,
            request,
            cancellationToken);

    public Task<PostAuthBootstrapSessionResult?> AcceptInvitationAsync(
        Guid platformUserId,
        string normalizedEmail,
        PostAuthAcceptInvitationRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken) =>
        _invitationBootstrap.AcceptInvitationAsync(
            platformUserId,
            normalizedEmail,
            request,
            safeReturnPath,
            cancellationToken);

    public Task<PostAuthBootstrapSessionResult?> SelectWorkspaceAsync(
        Guid platformUserId,
        PostAuthSelectWorkspaceRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken) =>
        _workspaceBootstrap.SelectWorkspaceAsync(platformUserId, request, safeReturnPath, cancellationToken);
}
