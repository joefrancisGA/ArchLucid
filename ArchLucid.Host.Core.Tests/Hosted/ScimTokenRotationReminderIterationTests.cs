using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Host.Core.Hosted;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ScimTokenRotationReminderIterationTests
{
    [Fact]
    public async Task Failed_reminder_write_does_not_prevent_later_reminders()
    {
        ScimTokenRotationCandidate first = new() { Id = Guid.NewGuid(), TenantId = Guid.NewGuid() };
        ScimTokenRotationCandidate second = new() { Id = Guid.NewGuid(), TenantId = Guid.NewGuid() };
        Mock<IScimTenantTokenRepository> tokens = new();
        tokens.Setup(t => t.ListActiveCreatedOnOrBeforeAsync(It.IsAny<DateTimeOffset>(), CancellationToken.None))
            .ReturnsAsync([first, second]);

        Mock<IAdminNotificationsRepository> notices = new(MockBehavior.Strict);
        notices.Setup(r => r.InsertAsync(
                "scim_token_rotation_due",
                It.Is<string>(summary => summary.Contains(first.Id.ToString(), StringComparison.Ordinal)),
                It.IsAny<string>(),
                CancellationToken.None))
            .ThrowsAsync(new InvalidOperationException("Temporary notification write failure"));
        notices.Setup(r => r.InsertAsync(
                "scim_token_rotation_due",
                It.Is<string>(summary => summary.Contains(second.Id.ToString(), StringComparison.Ordinal)),
                It.IsAny<string>(),
                CancellationToken.None))
            .Returns(Task.CompletedTask)
            .Verifiable();

        using ServiceProvider provider = new ServiceCollection()
            .AddSingleton(tokens.Object)
            .AddSingleton(notices.Object)
            .BuildServiceProvider();

        await ScimTokenRotationReminderIteration.RunOnceAsync(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new ScimOptions { TokenRotationReminderDays = 180 },
            NullLogger.Instance,
            CancellationToken.None);

        notices.Verify();
    }
}
