using ArchLucid.Contracts.User;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.UserPreferences;

/// <inheritdoc cref="IUserWorkspaceModeReader" />
public sealed class UserWorkspaceModeReader(IUserSettingsRepository userSettingsRepository) : IUserWorkspaceModeReader
{
    private readonly IUserSettingsRepository _userSettingsRepository =
        userSettingsRepository ?? throw new ArgumentNullException(nameof(userSettingsRepository));

    /// <inheritdoc />
    public async Task<bool> IsWorkingDeskAsync(string userId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        string? stored = await _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.WorkspaceMode,
            cancellationToken);

        return string.Equals(
            WorkspaceModeValues.ParseOrDefault(stored),
            WorkspaceModeValues.Working,
            StringComparison.OrdinalIgnoreCase);
    }
}
