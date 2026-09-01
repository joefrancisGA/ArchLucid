namespace ArchLucid.Application.Authorization;

/// <summary>
///     Enforces creator-or-admin delete/archive policy for unsealed architectures and in-flight reviews.
/// </summary>
public interface IWorkOwnershipDeleteAuthorizationService
{
    /// <summary>
    ///     Returns when the caller may delete or archive work created by <paramref name="createdByUserId" />.
    ///     Legacy rows with a null/empty creator remain deletable by any execute-capable operator.
    /// </summary>
    Task EnsureCanDeleteOwnedWorkAsync(string? createdByUserId, CancellationToken cancellationToken);
}
