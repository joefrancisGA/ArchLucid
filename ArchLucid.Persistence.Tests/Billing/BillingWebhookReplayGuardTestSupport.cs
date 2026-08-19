using ArchLucid.Core.Billing;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

internal static class BillingWebhookReplayGuardTestSupport
{
    internal static Mock<IBillingWebhookReplayGuard> CreatePermissiveReplayGuard()
    {
        Mock<IBillingWebhookReplayGuard> replayGuard = new();
        replayGuard
            .Setup(g => g.HasSeenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        replayGuard
            .Setup(g => g.RememberAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return replayGuard;
    }
}
