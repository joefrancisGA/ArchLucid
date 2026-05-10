using ArchLucid.Decisioning.Validation;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddSchemaValidation(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<SchemaValidationOptions>(
            configuration.GetSection(SchemaValidationOptions.SectionName));

        services.AddSingleton<ISchemaValidationService, SchemaValidationService>();

        return services;
    }

    public static IServiceCollection AddSchemaValidation(
        this IServiceCollection services,
        Action<SchemaValidationOptions> configureOptions)
    {
        services.Configure(configureOptions);
        services.AddSingleton<ISchemaValidationService, SchemaValidationService>();

        return services;
    }
}
