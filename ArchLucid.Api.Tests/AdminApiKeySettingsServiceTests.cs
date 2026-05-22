using ArchLucid.Api.Authentication;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

using Moq;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdminApiKeySettingsServiceTests
{
    private const string AdminKey = "api-key-bdr-admin-aB3xK9mN2pQ7wR5vZ1yC8dE6fG0hH4jJ";
    private const string ReaderKey = "api-key-bdr-reader-bC4xL0nO3pR8sT6uV2wW5xX7yY9zZ1aA";

    [Fact]
    public void GetSnapshot_returns_enabled_and_masked_admin_segments()
    {
        AdminApiKeySettingsService sut = CreateService(
            new ApiKeyAuthenticationOptions
            {
                Enabled = true,
                DevelopmentBypassAll = false,
                AdminKey = AdminKey,
                ReadOnlyKey = ReaderKey
            });

        AdminApiKeySettingsResponse snapshot = sut.GetSnapshot();

        snapshot.Enabled.Should().BeTrue();
        snapshot.DevelopmentBypassAll.Should().BeFalse();
        snapshot.Admin.IsConfigured.Should().BeTrue();
        snapshot.Admin.MaskedSegments.Should().NotBeEmpty();
        snapshot.Admin.MaskedSegments![0].Should().StartWith("****");
        snapshot.ReadOnly.IsConfigured.Should().BeTrue();
        snapshot.ReadOnly.MaskedSegments.Should().NotBeEmpty();
    }

    [Fact]
    public void Rotate_with_invalidate_previous_returns_replace_deployment_action()
    {
        AdminApiKeySettingsService sut = CreateService(
            new ApiKeyAuthenticationOptions
            {
                Enabled = true,
                AdminKey = AdminKey,
                ReadOnlyKey = ReaderKey
            });

        AdminApiKeyRotateResponse response = sut.Rotate(
            new AdminApiKeyRotateRequest { Slot = "Admin", InvalidatePrevious = true });

        response.Slot.Should().Be("Admin");
        response.DeploymentAction.Should().Be("Replace");
        response.PlaintextKey.Should().NotBeNullOrWhiteSpace();
        response.PlaintextKey.Length.Should().BeGreaterThanOrEqualTo(32);
        response.ReplaceConfigValue.Should().Be(response.PlaintextKey);
        response.ConfigPath.Should().Be($"{ApiKeyAuthenticationOptions.SectionPath}:AdminKey");
    }

    [Fact]
    public void Rotate_without_invalidate_previous_appends_when_slot_is_configured()
    {
        AdminApiKeySettingsService sut = CreateService(
            new ApiKeyAuthenticationOptions
            {
                Enabled = true,
                AdminKey = AdminKey
            });

        AdminApiKeyRotateResponse response = sut.Rotate(
            new AdminApiKeyRotateRequest { Slot = "Admin", InvalidatePrevious = false });

        response.DeploymentAction.Should().Be("Append");
        response.AppendConfigSuffix.Should().StartWith(",");
        response.AppendConfigSuffix.Should().Contain(response.PlaintextKey);
    }

    private static AdminApiKeySettingsService CreateService(ApiKeyAuthenticationOptions options)
    {
        Mock<IOptionsMonitor<ApiKeyAuthenticationOptions>> monitor = new();
        monitor.Setup(static m => m.CurrentValue).Returns(options);

        return new AdminApiKeySettingsService(monitor.Object);
    }
}
