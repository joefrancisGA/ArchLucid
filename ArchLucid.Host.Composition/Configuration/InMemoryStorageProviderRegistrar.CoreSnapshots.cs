using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Provenance;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterCoreSnapshots(IServiceCollection services, IConfiguration configuration)
    {
        RegisterPilotProvenance(services);
        RegisterAuthorityRuns(services, configuration);
    }
}
