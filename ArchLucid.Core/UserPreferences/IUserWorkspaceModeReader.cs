namespace ArchLucid.Core.UserPreferences;

/// <summary>Resolves whether the acting user is on a Working desk seat (WS-14 finalize gates).</summary>
public interface IUserWorkspaceModeReader
{
    /// <summary>True when the stored workspace mode for <paramref name="userId"/> is Working.</summary>
    /// <param name="userId">Canonical actor key from <c>IActorContext.GetActorId</c> (not the display name).</param>
    Task<bool> IsWorkingDeskAsync(string userId, CancellationToken cancellationToken);
}
