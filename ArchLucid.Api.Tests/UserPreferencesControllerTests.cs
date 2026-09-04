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
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.AppearancePreference.Should().Be(AppearancePreferenceValues.Default);
        body.AppearancePreferenceIsExplicit.Should().BeFalse();
        body.CloudPlatformScope.EvidenceOnly.Should().BeTrue();
        body.CloudPlatformScopeIsExplicit.Should().BeFalse();
        body.WhereToGoNextEnabled.Should().BeTrue();
        body.WhereToGoNextIsExplicit.Should().BeFalse();
        body.SampleReviewsOnOverviewEnabled.Should().BeTrue();
        body.SampleReviewsOnOverviewIsExplicit.Should().BeFalse();
        body.IanaTimeZoneId.Should().Be(IanaTimeZonePreferenceValues.Default);
        body.IanaTimeZoneIsExplicit.Should().BeFalse();
        body.WorkspaceMode.Should().Be(WorkspaceModeValues.Default);
        body.WorkspaceModeIsExplicit.Should().BeFalse();
        body.WorkspaceModeGraduationOffer.Should().Be(WorkspaceModeGraduationOfferValues.Default);
        body.WorkspaceModeGraduationOfferIsExplicit.Should().BeFalse();
        body.FindingsHideGenericEnabled.Should().BeFalse();
        body.FindingsHideGenericEnabledIsExplicit.Should().BeFalse();
        body.FindingsShowLowConfidenceEnabled.Should().BeFalse();
        body.FindingsShowLowConfidenceEnabledIsExplicit.Should().BeFalse();
        body.FindingsShowAdvisoryEnabled.Should().BeFalse();
        body.FindingsShowAdvisoryEnabledIsExplicit.Should().BeFalse();
    }

    [SkippableFact]
    public async Task GetPreferences_ReturnsStoredCloudPlatformScope()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.CloudPlatformScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"evidence-only":true,"azure":false,"aws":true,"gcp":false}""");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.CloudPlatformScope.Azure.Should().BeFalse();
        body.CloudPlatformScope.Aws.Should().BeTrue();
        body.CloudPlatformScopeIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SetAppearancePreference_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
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
    public async Task SetCloudPlatformScope_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetCloudPlatformScope(
            new SetCloudPlatformScopeRequest
            {
                Scope = new CloudPlatformScopeDto
                {
                    EvidenceOnly = true,
                    Azure = false,
                    Aws = true,
                    Gcp = false,
                },
            },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.CloudPlatformScope,
                """{"evidence-only":true,"azure":false,"aws":true,"gcp":false}""",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task GetPreferences_ReturnsStoredWhereToGoNextVisibility()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.WhereToGoNextEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync("false");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.WhereToGoNextEnabled.Should().BeFalse();
        body.WhereToGoNextIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SetWhereToGoNextVisibility_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetWhereToGoNextVisibility(
            new SetWhereToGoNextVisibilityRequest { Enabled = false },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.WhereToGoNextEnabled,
                "false",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task GetPreferences_ReturnsStoredSampleReviewsOnOverviewVisibility()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.SampleReviewsOnOverviewEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync("false");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.SampleReviewsOnOverviewEnabled.Should().BeFalse();
        body.SampleReviewsOnOverviewIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SetSampleReviewsOnOverviewVisibility_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetSampleReviewsOnOverviewVisibility(
            new SetSampleReviewsOnOverviewVisibilityRequest { Enabled = false },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.SampleReviewsOnOverviewEnabled,
                "false",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task GetPreferences_ReturnsStoredIanaTimeZone()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.IanaTimeZoneId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("America/New_York");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.IanaTimeZoneId.Should().Be("America/New_York");
        body.IanaTimeZoneIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SetIanaTimeZonePreference_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetIanaTimeZonePreference(
            new SetIanaTimeZonePreferenceRequest { IanaTimeZoneId = "America/Chicago" },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.IanaTimeZoneId,
                "America/Chicago",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task SetIanaTimeZonePreference_NormalizesUtcAliases()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetIanaTimeZonePreference(
            new SetIanaTimeZonePreferenceRequest { IanaTimeZoneId = "Etc/UTC" },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.IanaTimeZoneId,
                "UTC",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task GetPreferences_ReturnsStoredWorkspaceMode()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.WorkspaceMode, It.IsAny<CancellationToken>()))
            .ReturnsAsync("working");

        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.GetPreferences(CancellationToken.None);

        OkObjectResult ok = (OkObjectResult)result;
        UserPreferencesResponse body = ok.Value.Should().BeOfType<UserPreferencesResponse>().Subject;
        body.WorkspaceMode.Should().Be(WorkspaceModeValues.Working);
        body.WorkspaceModeIsExplicit.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SetWorkspaceMode_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetWorkspaceMode(
            new SetWorkspaceModeRequest { Mode = "working" },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.WorkspaceMode,
                "working",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task SetWorkspaceModeGraduationOffer_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetWorkspaceModeGraduationOffer(
            new SetWorkspaceModeGraduationOfferRequest { State = "dismissed" },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.WorkspaceModeGraduationOffer,
                "dismissed",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task SetFindingsVisibilityPreferences_ReturnsNoContentWhenValid()
    {
        Mock<IUserSettingsRepository> repository = CreateRepositoryMock();
        UserPreferencesController sut = CreateController(repository.Object);

        IActionResult result = await sut.SetFindingsVisibilityPreferences(
            new SetFindingsVisibilityPreferencesRequest
            {
                HideGenericEnabled = true,
                ShowLowConfidenceEnabled = false,
                ShowAdvisoryEnabled = true,
            },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.FindingsHideGenericEnabled,
                "true",
                It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            repo => repo.UpsertAsync(
                "jwt:user-1",
                UserSettingKeys.FindingsShowAdvisoryEnabled,
                "true",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static Mock<IUserSettingsRepository> CreateRepositoryMock()
    {
        Mock<IUserSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.AppearancePreference, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.CloudPlatformScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.WhereToGoNextEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.SampleReviewsOnOverviewEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.IanaTimeZoneId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.WorkspaceMode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.WorkspaceModeGraduationOffer, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.ProfessionalWorkbenchEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.RoiLoadedHourlyCostUsd, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.FindingsHideGenericEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.FindingsShowLowConfidenceEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        repository
            .Setup(repo => repo.TryGetAsync("jwt:user-1", UserSettingKeys.FindingsShowAdvisoryEnabled, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        return repository;
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
