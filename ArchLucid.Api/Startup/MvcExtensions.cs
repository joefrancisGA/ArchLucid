using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Auth;
using ArchLucid.Api.Filters;
using ArchLucid.Api.Security;
using ArchLucid.Api.Formatters;
using ArchLucid.Api.OpenApi;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Api.Startup;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Reporting;

using Asp.Versioning;

using FluentValidation;
using FluentValidation.AspNetCore;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Startup;

internal static class MvcExtensions
{
    public static IServiceCollection AddArchLucidMvc(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddSingleton<AuditEventCsvFormatter>();
        services.AddSingleton<IConfigureOptions<MvcOptions>, AuditCsvFormatterMvcOptionsConfigurer>();

        IMvcBuilder mvcBuilder = services.AddControllers(options =>
            {
                options.Conventions.Add(new DefaultPublicApiRateLimitConvention());
                options.Filters.Add<ApiProblemDetailsExceptionFilter>();
                options.Filters.Add<TrialLimitExceededAuditFilter>();
                options.Filters.Add<RouteTenantScopeBindingFilter>();
            })
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
                // k6 and CLI payloads often send numeric enum values (cloudProvider: 1); allow integers alongside strings.
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(null, allowIntegerValues: true));
            });

        if (ArchLucidSaml2HostFlags.IsSaml2Enabled(configuration))
            mvcBuilder.AddApplicationPart(typeof(ITfoxtec.Identity.Saml2.MvcCore.HttpRequestExtensions).Assembly);

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                ValidationProblemDetails problem = new(context.ModelState)
                {
                    Type = ProblemTypes.ValidationFailed,
                    Title = "One or more validation errors occurred.",
                    Status = StatusCodes.Status400BadRequest,
                    Instance = context.HttpContext.Request.Path.Value
                };
                ProblemErrorCodes.AttachErrorCode(problem, ProblemTypes.ValidationFailed);
                ProblemSupportHints.AttachForProblemType(
                    problem,
                    ProblemDetailsAudienceHttpContext.Resolve(context.HttpContext));
                ProblemCorrelation.Attach(problem, context.HttpContext);
                return new BadRequestObjectResult(problem)
                {
                    ContentTypes = { ApplicationProblemMapper.ProblemJsonMediaType }
                };
            };
        });
        services.AddProblemDetails();
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
            options.ApiVersionReader = ApiVersionReader.Combine(
                new UrlSegmentApiVersionReader(),
                new QueryStringApiVersionReader("api-version"),
                new HeaderApiVersionReader("api-version"));
        }).AddMvc().AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<ArchitectureRequestValidator>();
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer<MicrosoftOpenApiAuthDocumentTransformer>();
            options.AddDocumentTransformer<MicrosoftOpenApiCodeGenFriendlySchemaTransformer>();
            options.AddDocumentTransformer<RunSummaryResponseOpenApiContractTransformer>();
            options.AddDocumentTransformer<PublicHttpContractSchemasOpenApiDocumentTransformer>();
            options.AddOperationTransformer<MicrosoftOpenApiAnonymousSecurityOperationTransformer>();
            options.AddOperationTransformer<MicrosoftOpenApiAudienceOperationTransformer>();
            options.AddOperationTransformer<MicrosoftOpenApiEvidenceBulkUploadOperationTransformer>();
            options.AddDocumentTransformer<MicrosoftOpenApiAudienceSchemaDocumentTransformer>();
        });
        services.AddEndpointsApiExplorer();
        services.AddArchLucidSwagger();
        return services;
    }
}
