using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.UserPreferences;

/// <inheritdoc cref="IWorkingCareerRehearsalDoorReader" />
public sealed class WorkingCareerRehearsalDoorSettingsReader(
    IUserSettingsRepository userSettingsRepository) : IWorkingCareerRehearsalDoorReader
{
    private readonly IUserSettingsRepository _userSettingsRepository =
        userSettingsRepository ?? throw new ArgumentNullException(nameof(userSettingsRepository));

    /// <inheritdoc />
    public Task<string?> TryGetStoredDoorAsync(string userId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        return _userSettingsRepository.TryGetAsync(
            userId,
            UserSettingKeys.WorkingCareerRehearsalDoor,
            cancellationToken);
    }
}
