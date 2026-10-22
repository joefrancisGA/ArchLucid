using ArchLucid.Application.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Application.Tests.Architecture;

internal static class ArchitectureIdentityServiceTestSupport
{
    public static ArchitectureIdentityService Create(
        IArchitectureIdentityRepository identityRepository,
        IRunRepository runRepository,
        IDraftRequestRepository draftRepository,
        IArchitectureShareRepository? shareRepository = null) =>
        new(
            identityRepository,
            shareRepository ?? new InMemoryArchitectureShareRepository(),
            runRepository,
            draftRepository);

    public static InMemoryArchitectureIdentityRepository CreateIdentityRepository(
        IDraftRequestRepository draftRepository,
        IRunRepository runRepository,
        IArchitectureShareRepository? shareRepository = null) =>
        new(draftRepository, runRepository, shareRepository: shareRepository);
}
