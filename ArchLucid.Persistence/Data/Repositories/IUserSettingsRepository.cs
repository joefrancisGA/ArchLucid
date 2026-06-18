namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads and writes <c>dbo.UserSettings</c> for user-scoped preferences.</summary>
public interface IUserSettingsRepository
{
    /// <summary>Returns the stored preference value, or null when unset.</summary>
    Task<string?> TryGetAsync(string userId, string preferenceKey, CancellationToken cancellationToken);

    /// <summary>Inserts or updates a preference value for the user.</summary>
    Task UpsertAsync(
        string userId,
        string preferenceKey,
        string preferenceValue,
        CancellationToken cancellationToken);
}
