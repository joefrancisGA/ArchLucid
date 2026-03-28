using System.Text.Json;

using ArchiForge.Api.ProblemDetails;
using ArchiForge.Api.Validators;

using Asp.Versioning;

using FluentValidation;
using FluentValidation.AspNetCore;

using Microsoft.AspNetCore.Mvc;

namespace ArchiForge.Api.Startup;

internal static class MvcExtensions
{
    public static IServiceCollection AddArchiForgeMvc(this IServiceCollection services)
    {
        services.AddControllers(options =>
            {
                options.Filters.Add<ApiProblemDetailsExceptionFilter>();
            })
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
            });
        services.AddProblemDetails();
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
        }).AddMvc().AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<ArchitectureRequestValidator>();
        services.AddOpenApi();
        services.AddEndpointsApiExplorer();
        services.AddArchiForgeSwagger();
        return services;
    }
}
