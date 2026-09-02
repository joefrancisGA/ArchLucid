using ArchLucid.Application.Authority;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Persistence.Ports;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace ArchLucid.Application.Tests.Bootstrap.Seeders;

[Trait("Suite", "Application")]
public sealed class DemoSeedPersistenceChainTests
{
    [Fact]
    public async Task EnsureRequestAsync_skips_existing()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync("r1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { RequestId = "r1" });

        DemoSeedPersistenceChain chain = new(MakeDeps(requests.Object));
        await chain.EnsureRequestAsync(new ArchitectureRequest { RequestId = "r1" }, CancellationToken.None);

        requests.Verify(
            repository => repository.CreateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static DemoSeedSeederDependencies MakeDeps(
        IArchitectureRequestRepository? requests = null,
        IRunRepository? runs = null) =>
        new(
            requests ?? Mock.Of<IArchitectureRequestRepository>(),
            runs ?? Mock.Of<IRunRepository>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAuthorityCommittedManifestChainWriter>(),
            Mock.Of<IOptionsMonitor<DemoOptions>>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IRunExportRecordRepository>(),
            Mock.Of<IArtifactBundleRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IActorContext>(),
            NullLogger.Instance);
}
