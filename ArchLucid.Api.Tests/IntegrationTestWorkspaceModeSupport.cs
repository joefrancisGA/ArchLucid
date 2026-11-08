using ArchLucid.Api.Auth.Models;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration hosts default workspace mode to <see cref="WorkspaceModeValues.Working" />, which enables career
///     measurement-floor finalize gates. Most SQL integration tests only need commit/finalize setup — pin Guided unless
///     explicitly testing Working-desk finalize honesty.
/// </summary>
internal static class IntegrationTestWorkspaceModeSupport
{
    /// <summary>
    ///     Legacy bare DevUserId from <see cref="ArchLucidAuthOptions" /> — do not use for
    ///     <see cref="IUserSettingsRepository" /> keys; preferences use <see cref="IActorContext.GetActorId" />.
    /// </summary>
    internal const string DevelopmentBypassUserId = "dev-user";

    /// <summary>
    ///     User-settings key matching DevelopmentBypass + <see cref="HttpActorContext.GetActorId" /> (oid claim, no tid).
    /// </summary>
    internal static string ResolveDevelopmentBypassActorSettingsKey(IServiceProvider services)
    {
        ArgumentNullException.ThrowIfNull(services);

        ArchLucidAuthOptions authOptions = services.GetRequiredService<IOptions<ArchLucidAuthOptions>>().Value;
        string devUserId = string.IsNullOrWhiteSpace(authOptions.DevUserId)
            ? DevelopmentBypassUserId
            : authOptions.DevUserId.Trim();

        return $"{ActorContextKeys.JwtActorKeyPrefix}{devUserId}";
    }

    internal static async Task PinGuidedWorkspaceModeForDevUserAsync(
        BaseIntegrationTestFixture factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        using IServiceScope scope = factory.Services.CreateScope();
        IUserSettingsRepository settings =
            scope.ServiceProvider.GetRequiredService<IUserSettingsRepository>();
        string actorSettingsKey = ResolveDevelopmentBypassActorSettingsKey(scope.ServiceProvider);

        await settings.UpsertAsync(
            actorSettingsKey,
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
        string actorSettingsKey = ResolveDevelopmentBypassActorSettingsKey(scope.ServiceProvider);

        await settings.UpsertAsync(
            actorSettingsKey,
            UserSettingKeys.WorkspaceMode,
            WorkspaceModeValues.Serialize(WorkspaceModeValues.Working),
            cancellationToken).ConfigureAwait(false);
    }
}
