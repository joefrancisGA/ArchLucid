using System.Text;
using System.Text.Json;

using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Host.Core.Jobs;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests;

/// <summary>RC24 coverage uplift: trial lifecycle email handler + jobs/recurrence options defaults.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatchRc24Tests
{
    [Fact]
    public async Task TrialLifecycleEmailIntegrationEventHandler_dispatches_valid_envelope()
    {
        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            Trigger = TrialLifecycleEmailTrigger.MidTrialDay7,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<ITrialLifecycleEmailDispatcher> dispatcher = new();
        dispatcher
            .Setup(d => d.DispatchAsync(It.IsAny<TrialLifecycleEmailIntegrationEnvelope>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ServiceCollection services = new();
        services.AddSingleton(dispatcher.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
        TrialLifecycleEmailIntegrationEventHandler sut = new(
            scopeFactory,
            NullLogger<TrialLifecycleEmailIntegrationEventHandler>.Instance);
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(envelope, IntegrationEventJson.Options);

        await sut.HandleAsync(utf8, CancellationToken.None);

        sut.EventType.Should().Be(IntegrationEventTypes.TrialLifecycleEmailV1);
        dispatcher.Verify(
            d => d.DispatchAsync(
                It.Is<TrialLifecycleEmailIntegrationEnvelope>(e =>
                    e.Trigger == TrialLifecycleEmailTrigger.MidTrialDay7
                    && e.TenantId == envelope.TenantId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TrialLifecycleEmailIntegrationEventHandler_rejects_invalid_json()
    {
        ServiceCollection services = new();
        services.AddSingleton(Mock.Of<ITrialLifecycleEmailDispatcher>());
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
        TrialLifecycleEmailIntegrationEventHandler sut = new(
            scopeFactory,
            NullLogger<TrialLifecycleEmailIntegrationEventHandler>.Instance);
        ReadOnlyMemory<byte> badJson = Encoding.UTF8.GetBytes("{ not-json");

        Func<Task> act = () => sut.HandleAsync(badJson, CancellationToken.None);

        await act.Should().ThrowAsync<FormatException>().WithMessage("*valid JSON*");
    }

    [Fact]
    public async Task TrialLifecycleEmailIntegrationEventHandler_rejects_null_payload()
    {
        ServiceCollection services = new();
        services.AddSingleton(Mock.Of<ITrialLifecycleEmailDispatcher>());
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
        TrialLifecycleEmailIntegrationEventHandler sut = new(
            scopeFactory,
            NullLogger<TrialLifecycleEmailIntegrationEventHandler>.Instance);
        ReadOnlyMemory<byte> nullJson = Encoding.UTF8.GetBytes("null");

        Func<Task> act = () => sut.HandleAsync(nullJson, CancellationToken.None);

        await act.Should().ThrowAsync<FormatException>().WithMessage("*null*");
    }

    [Fact]
    public void ArchLucidJobsOptions_exposes_section_path_and_empty_defaults()
    {
        ArchLucidJobsOptions options = new();

        ArchLucidJobsOptions.SectionPath.Should().Be("Jobs");
        options.OffloadedToContainerJobs.Should().BeEmpty();
        options.DeployedContainerJobNames.Should().BeNull();
    }

    [Fact]
    public void ArchitectureReviewRecurrenceHostedServiceOptions_defaults_poll_interval()
    {
        ArchitectureReviewRecurrenceHostedServiceOptions options = new();

        ArchitectureReviewRecurrenceHostedServiceOptions.SectionName
            .Should().Be("ArchLucid:ArchitectureReviewRecurrence");
        options.PollInterval.Should().Be(TimeSpan.FromMinutes(10));
    }
}
