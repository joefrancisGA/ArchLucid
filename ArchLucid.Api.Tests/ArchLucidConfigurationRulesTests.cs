using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]

/// <summary>
///     Fail-fast configuration rule coverage. Methods are split by rule family across partial files.
/// </summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    private static Dictionary<string, string?> ProductionApiBaselineWithBillingNoop() =>
        new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucid:SqlTopology:Mode"] = "SystemWithPerTenantCatalogs",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.Noop,
        };
}
