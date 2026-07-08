using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Application.Tests.TestDoubles;
using ArchLucid.Core.Scoping;using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Runs.Coordination;

internal static class ArchitectureRunAuthorityCoordinationTestFactory
{
    internal static ArchitectureRunAuthorityCoordination Create(
        IAuthorityRunOrchestrator authorityRunOrchestrator,
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IAzureExtractorPackageRepository? azureExtractorPackageRepository = null,
        InMemoryTechnologyLedgerRepository? ledgerRepository = null)
    {
        InMemoryTechnologyLedgerRepository ledger = ledgerRepository ?? new InMemoryTechnologyLedgerRepository();

        return new ArchitectureRunAuthorityCoordination(
            authorityRunOrchestrator,
            runRepository,
            scopeContextProvider,
            azureExtractorPackageRepository ?? new NoOpAzureExtractorPackageRepository(),
            ledger,
            TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(ledger),
            TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(ledger, scopeContextProvider),
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);
    }
}
