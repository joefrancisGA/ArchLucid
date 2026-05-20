using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Minimal API host for OpenAPI contract checks: in-memory authority storage, no SQL, Development pipeline
///     (Scalar + <c>/swagger/v1/swagger.json</c> + Microsoft OpenAPI; generation uses <c>CustomSchemaIds</c> and optional
///     auth security filters).
/// </summary>
/// <remarks>
///     Matches <see cref="ArchLucidApiFactory" /> knobs that gate readiness under CI/agent env leakage:
///     <see cref="ArchLucid.Core.Integration.IntegrationEventsOptions" /> clears so
///     <see cref="ArchLucid.Api.Health.AzureServiceBusNamespaceHealthCheck" /> does not open real Service Bus connections;
///     leader election disabled so reconciliation timing matches local runs.
/// </remarks>
public class OpenApiContractWebAppFactory : BaseIntegrationTestFixture
{
    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = "InMemory";
        settings["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value;
        settings["IntegrationEvents:QueueOrTopicName"] = "";
        settings["IntegrationEvents:ServiceBusConnectionString"] = "";
        settings["IntegrationEvents:ServiceBusFullyQualifiedNamespace"] = "";
        settings["IntegrationEvents:ServiceBusManagedIdentityClientId"] = "";
    }
}
