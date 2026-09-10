namespace ArchLucid.Core.UserPreferences;

/// <summary>Resolves whether the acting user is on a Working desk seat (WS-14 finalize gates).</summary>
public interface IUserWorkspaceModeReader
{
    Task<bool> IsWorkingDeskAsync(string userId, CancellationToken cancellationToken);
}
