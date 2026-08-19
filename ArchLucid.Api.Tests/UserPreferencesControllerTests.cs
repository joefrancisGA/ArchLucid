using ArchLucid.Api.Controllers.User;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Unit coverage for <c>/v1/user/preferences</c> HTTP wiring.</summary>
[Trait("Category", "Unit")]
public sealed class UserPreferencesControllerTests
{
    [SkippableFact]
    public async Task GetPreferences_ReturnsDefaultWhenUnset()
    {
        Mock<IUserSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.AppearancePreference, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.AppearancePreference.Should().Be(AppearancePreferenceValues.Default);
        body.AppearancePreferenceIsExplicit.Should().BeFalse();
    }

    [SkippableFact]
    public async Task GetPreferences_MarksExplicitStoredValue()
    {
        Mock<IUserSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.AppearancePreference, It.IsAny<CancellationToken>()))
            .ReturnsAsync("system");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.AppearancePreference.Should().Be("system");
        body.AppearancePreferenceIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task GetPreferences_ReturnsStoredValue()
    {
        Mock<IUserSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.AppearancePreference, It.IsAny<CancellationToken>()))
            .ReturnsAsync("dark");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.AppearancePreference.Should().Be("dark");
        body.AppearancePreferenceIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SetAppearancePreference_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = new();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetAppearancePreference(
            new SetAppearancePreferenceRequest { Value = "light" },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.AppearancePreference,
                "light",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task SetAppearancePreference_ReturnsBadRequestWhenInvalid()
    {
        Mock<IUserSettingsRepository> repository = new();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetAppearancePreference(
            new SetAppearancePreferenceRequest { Value = "sepia" },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        repository.Verify(
            repo => repo.UpsertAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static UserPreferencesController CreateController(IUserSettingsRepository repository)
    {
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.GetActorId()).Returns("jwt:user-1");
        actorContext.Setup(context => context.GetActor()).Returns("operator@example.com");

        return new UserPreferencesController(actorContext.Object, repository)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
