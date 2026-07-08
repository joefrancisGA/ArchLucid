using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

internal static class AuthorityCoordinationTestFactory
{
    internal static ArchitectureRunAuthorityCoordination Create(
        IAuthorityRunOrchestrator authorityRunOrchestrator,
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IAzureExtractorPackageRepository? azureExtractorPackageRepository = null)
    {
        InMemoryTechnologyLedgerRepository ledgerRepository = new();

        return new ArchitectureRunAuthorityCoordination(
            authorityRunOrchestrator,
            runRepository,
            scopeContextProvider,
            azureExtractorPackageRepository ?? new NoOpAzureExtractorPackageRepository(),
            ledgerRepository,
            new TechnologyLedgerRequestSeeder(ledgerRepository, TimeProvider.System),
            new TechnologyLedgerEvidenceSeeder(
                ledgerRepository,
                scopeContextProvider,
                Mock.Of<IAzureExtractorPackageRepository>(),
                Mock.Of<ICloudInventoryExtractorPackageRepository>(),
                new InfrastructureDeclarationsPayloadNormalizer([]),
                TimeProvider.System),
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);
    }
}
