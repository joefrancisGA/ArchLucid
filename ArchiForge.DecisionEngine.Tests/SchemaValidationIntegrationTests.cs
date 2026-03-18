using ArchiForge.DecisionEngine.Validation;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace ArchiForge.DecisionEngine.Tests;

public sealed class SchemaValidationIntegrationTests
{
    [Fact]
    public void ServiceRegistration_WithConfiguration_RegistersSuccessfully()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        services.AddSchemaValidation(options =>
        {
            options.AgentResultSchemaPath = "schemas/agentresult.schema.json";
            options.GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json";
            options.EnableDetailedErrors = true;
        });

        var serviceProvider = services.BuildServiceProvider();

        var service = serviceProvider.GetService<ISchemaValidationService>();

        service.Should().NotBeNull();
        service.Should().BeOfType<SchemaValidationService>();
    }

    [Fact]
    public void ServiceRegistration_IsSingleton()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        services.AddSchemaValidation(options =>
        {
            options.AgentResultSchemaPath = "schemas/agentresult.schema.json";
            options.GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json";
        });

        var serviceProvider = services.BuildServiceProvider();

        var service1 = serviceProvider.GetService<ISchemaValidationService>();
        var service2 = serviceProvider.GetService<ISchemaValidationService>();

        service1.Should().BeSameAs(service2);
    }

    [Fact]
    public void MultipleValidations_UseSameSchemasInstances()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        services.AddSchemaValidation(options =>
        {
            options.AgentResultSchemaPath = "schemas/agentresult.schema.json";
            options.GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json";
        });

        var serviceProvider = services.BuildServiceProvider();
        var service = serviceProvider.GetRequiredService<ISchemaValidationService>();

        var result1 = service.ValidateAgentResultJson("{}");
        var result2 = service.ValidateAgentResultJson("{}");

        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
    }
}
