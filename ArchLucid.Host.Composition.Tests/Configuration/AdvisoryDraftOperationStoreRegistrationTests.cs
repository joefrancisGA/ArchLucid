using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Planning;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class AdvisoryDraftOperationStoreRegistrationTests
{
    [Fact]
    public void InMemory_storage_registers_in_memory_advisory_draft_operation_store()
    {
        ServiceCollection services = [];
        new InMemoryStorageProviderRegistrar().Register(services, new ConfigurationBuilder().Build());
        DraftIntakeCompositionRegistrar.Register(services, new ConfigurationBuilder().Build());

        ServiceDescriptor? descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IAdvisoryDraftOperationStore));

        descriptor.Should().NotBeNull();
        descriptor!.ImplementationType.Should().Be(typeof(InMemoryAdvisoryDraftOperationStore));
    }

    [Fact]
    public void Sql_storage_registers_sql_advisory_draft_operation_store()
    {
        ServiceCollection services = [];
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] = "Server=(localdb)\\mssqllocaldb;Database=ArchLucid_Test;Trusted_Connection=True;",
                ["ArchLucid:StorageProvider"] = "Sql",
            })
            .Build();

        new SqlStorageProviderRegistrar().Register(services, configuration);
        DraftIntakeCompositionRegistrar.Register(services, new ConfigurationBuilder().Build());

        services.Should().Contain(static d => d.ServiceType == typeof(IAdvisoryDraftOperationRepository)
                                              && d.ImplementationType == typeof(DapperAdvisoryDraftOperationRepository));
        services.Should().Contain(static d => d.ServiceType == typeof(IAdvisoryDraftOperationStore)
                                              && d.ImplementationType == typeof(SqlAdvisoryDraftOperationStore));
    }
}
