using ArchLucid.Decisioning.Validation;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddSchemaValidation(IConfiguration configuration)
        {
            services.Configure<SchemaValidationOptions>(
                configuration.GetSection(SchemaValidationOptions.SectionName));

            services.AddSingleton<ISchemaValidationService, SchemaValidationService>();

            return services;
        }

        public IServiceCollection AddSchemaValidation(Action<SchemaValidationOptions> configureOptions)
        {
            services.Configure(configureOptions);
            services.AddSingleton<ISchemaValidationService, SchemaValidationService>();

            return services;
        }
    }
}
