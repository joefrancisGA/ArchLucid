using ArchLucid.Contracts.User;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration hosts default workspace mode to <see cref="WorkspaceModeValues.Working" />, which enables career
///     measurement-floor finalize gates. Most SQL integration tests only need commit/finalize setup — pin Guided unless
///     explicitly testing Working-desk finalize honesty.
/// </summary>
internal static class IntegrationTestWorkspaceModeSupport
{
    internal const string DevelopmentBypassUserId = "dev-user";

    internal static async Task PinGuidedWorkspaceModeForDevUserAsync(
        BaseIntegrationTestFixture factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        using IServiceScope scope = factory.Services.CreateScope();
        IUserSettingsRepository settings =
            scope.ServiceProvider.GetRequiredService<IUserSettingsRepository>();

        await settings.UpsertAsync(
            DevelopmentBypassUserId,
            UserSettingKeys.WorkspaceMode,
            WorkspaceModeValues.Serialize(WorkspaceModeValues.Guided),
            cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinWorkingWorkspaceModeForDevUserAsync(
        BaseIntegrationTestFixture factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        using IServiceScope scope = factory.Services.CreateScope();
        IUserSettingsRepository settings =
            scope.ServiceProvider.GetRequiredService<IUserSettingsRepository>();

        await settings.UpsertAsync(
            DevelopmentBypassUserId,
            UserSettingKeys.WorkspaceMode,
            WorkspaceModeValues.Serialize(WorkspaceModeValues.Working),
            cancellationToken).ConfigureAwait(false);
    }
}
