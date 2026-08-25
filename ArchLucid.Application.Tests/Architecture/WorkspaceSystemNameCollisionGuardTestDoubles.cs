using ArchLucid.Application.Architecture;
using ArchLucid.Core.Scoping;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

internal static class WorkspaceSystemNameCollisionGuardTestDoubles
{
    public static IWorkspaceSystemNameCollisionGuard NoOp()
    {
        Mock<IWorkspaceSystemNameCollisionGuard> guard = new();
        guard
            .Setup(g => g.EnsureAvailableAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return guard.Object;
    }
}
