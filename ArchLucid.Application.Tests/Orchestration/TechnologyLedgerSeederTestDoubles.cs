using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

internal static class TechnologyLedgerSeederTestDoubles
{
    internal static TechnologyLedgerRequestSeeder CreateRequestSeeder(ITechnologyLedgerRepository repository) =>
        new(repository, TimeProvider.System);

    internal static TechnologyLedgerEvidenceSeeder CreateEvidenceSeeder(
        ITechnologyLedgerRepository repository,
        IScopeContextProvider scopeContextProvider) =>
        new(
            repository,
            scopeContextProvider,
            Mock.Of<IAzureExtractorPackageRepository>(),
            Mock.Of<ICloudInventoryExtractorPackageRepository>(),
            new InfrastructureDeclarationsPayloadNormalizer([]),
            TimeProvider.System);

    internal static TechnologyLedgerTopologyProposalSeeder CreateTopologyProposalSeeder(
        ITechnologyLedgerRepository repository,
        IScopeContextProvider scopeContextProvider) =>
        new(repository, scopeContextProvider, TimeProvider.System);
}