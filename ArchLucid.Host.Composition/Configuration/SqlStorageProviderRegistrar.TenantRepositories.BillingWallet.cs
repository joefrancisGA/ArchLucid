using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    private static void RegisterTenantRepositoriesBillingWallet(IServiceCollection services)
    {
        services.AddScoped<IBillingLedger, SqlBillingLedger>();
        services.AddScoped<IUsageEventRepository, DapperUsageEventRepository>();
        services.AddScoped<ILlmTenantBudgetRepository, SqlLlmTenantBudgetRepository>();
        services.AddScoped<IAiUsageEventRepository, Persistence.AiUsage.SqlAiUsageEventRepository>();
        services.AddScoped<ILlmTenantWalletRepository, SqlLlmTenantWalletRepository>();
    }
}
