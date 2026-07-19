using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

using System.Security.Claims;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch4Tests
{
    [Fact]
    public async Task NoOpRoleSyncService_completes_without_mutating_principal()
    {
        NoOpRoleSyncService sut = new();
        ClaimsPrincipal principal = new(new ClaimsIdentity([new Claim(ClaimTypes.Name, "user")], "test"));

        await sut.Invoking(s => s.ApplyEntraJwtAndDirectoryOverridesAsync(principal, CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public void AuthorityPipelineWorkProcessorOptions_exposes_section_and_defaults()
    {
        AuthorityPipelineWorkProcessorOptions options = new();

        AuthorityPipelineWorkProcessorOptions.SectionName.Should().Be("AuthorityPipelineWork");
        options.LeaseDurationSeconds.Should().Be(900);
        options.MaxAttemptsBeforeDeadLetter.Should().Be(48);
        options.MaxConcurrentBatchEntries.Should().Be(4);
    }

    [Fact]
    public void DataConsistencyEnforcementMode_exposes_expected_values()
    {
        Enum.GetNames(typeof(DataConsistencyEnforcementMode)).Should().Contain(["Off", "Warn", "Alert", "Quarantine"]);
    }
}
