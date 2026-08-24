using ArchLucid.Application.Diagnostics;
using ArchLucid.Core.Configuration;

using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Diagnostics;

public sealed class DevelopmentCatalogResetServiceTests
{
    [Fact]
    public async Task ResetToFreshInstallAsync_Throws_WhenHostIsNotDevelopment()
    {
        DevelopmentCatalogResetService service = CreateService(
            new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["ConnectionStrings:ArchLucid"] = "Server=localhost;Database=ArchLucid;Trusted_Connection=True;Encrypt=False",
            },
            Environments.Production);

        Func<Task> act = () => service.ResetToFreshInstallAsync();

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Development*");
    }

    [Fact]
    public async Task ResetToFreshInstallAsync_Throws_WhenStorageProviderIsNotSql()
    {
        DevelopmentCatalogResetService service = CreateService(
            new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "InMemory",
            },
            Environments.Development);

        Func<Task> act = () => service.ResetToFreshInstallAsync();

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*StorageProvider=Sql*");
    }

    private static DevelopmentCatalogResetService CreateService(
        IReadOnlyDictionary<string, string?> settings,
        string environmentName)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        Mock<IWebHostEnvironment> environment = new();
        environment.SetupGet(e => e.EnvironmentName).Returns(environmentName);

        return new DevelopmentCatalogResetService(
            configuration,
            environment.Object,
            Mock.Of<Persistence.Sql.ISchemaBootstrapper>(),
            Mock.Of<Application.Bootstrap.IDemoSeedService>(),
            Options.Create(new DemoOptions()),
            Options.Create(new ArchLucidPersistenceOptions()),
            NullLogger<DevelopmentCatalogResetService>.Instance);
    }
}
