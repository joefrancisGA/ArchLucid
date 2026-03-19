using ArchiForge.Api.Authentication;
using ArchiForge.Api.Middleware;
using ArchiForge.Api.ProblemDetails;
using ArchiForge.Api.Startup;
using ArchiForge.Api.Validators;
using ArchiForge.Data.Infrastructure;
using Asp.Versioning;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.RateLimiting;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

namespace ArchiForge.Api
{
    public partial class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Host.UseSerilog((context, services, configuration) => configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext());

            // Add services to the container.

            builder.Services.AddControllers(options =>
            {
                options.Filters.Add<ApiProblemDetailsExceptionFilter>();
            });
            builder.Services.AddProblemDetails();
            builder.Services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
            }).AddMvc().AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'VVV";
                options.SubstituteApiVersionInUrl = true;
            });
            builder.Services.AddFluentValidationAutoValidation();
            builder.Services.AddValidatorsFromAssemblyContaining<ArchitectureRequestValidator>();
            builder.Services.AddOpenApi();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new() { Title = "ArchiForge API", Version = "v1" });
                c.OperationFilter<Swagger.ReplayExamplesOperationFilter>();
                c.OperationFilter<Swagger.ComparisonHistoryQueryOperationFilter>();
                c.OperationFilter<Swagger.ProblemDetailsResponsesOperationFilter>();
            });

            builder.Services.AddAuthentication("ApiKey")
                .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>("ApiKey", options => { });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("CanCommitRuns", policy =>
                    policy.RequireClaim("permission", "commit:run"));

                options.AddPolicy("CanSeedResults", policy =>
                    policy.RequireClaim("permission", "seed:results"));

                options.AddPolicy("CanExportConsultingDocx", policy =>
                    policy.RequireClaim("permission", "export:consulting-docx"));

                options.AddPolicy("CanReplayComparisons", policy =>
                    policy.RequireClaim("permission", "replay:comparisons"));

                options.AddPolicy("CanViewReplayDiagnostics", policy =>
                    policy.RequireClaim("permission", "replay:diagnostics"));
            });

            var prometheusEnabled = builder.Configuration.GetValue("Observability:Prometheus:Enabled", false);
            var consoleExporterEnabled = builder.Configuration.GetValue("Observability:ConsoleExporter:Enabled", builder.Environment.IsDevelopment());

            builder.Services.AddOpenTelemetry()
                .ConfigureResource(resource => resource
                    .AddService(
                        serviceName: "ArchiForge.Api",
                        serviceVersion: typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown",
                        serviceInstanceId: Environment.MachineName))
                .WithTracing(tracing =>
                {
                    tracing.AddAspNetCoreInstrumentation();
                    tracing.AddHttpClientInstrumentation();
                    tracing.AddSqlClientInstrumentation();
                    if (consoleExporterEnabled)
                    {
                        tracing.AddConsoleExporter();
                    }
                })
                .WithMetrics(metrics =>
                {
                    metrics.AddAspNetCoreInstrumentation();
                    metrics.AddHttpClientInstrumentation();
                    if (prometheusEnabled)
                    {
                        metrics.AddPrometheusExporter();
                    }
                });

            builder.Services.AddArchiForgeRateLimiting(builder.Configuration);
            builder.Services.AddArchiForgeCors(builder.Configuration);
            builder.Services.AddArchiForgeApplicationServices(builder.Configuration);

            var app = builder.Build();

            var connectionString = app.Configuration.GetConnectionString("ArchiForge");
            if (!string.IsNullOrEmpty(connectionString) && !DatabaseMigrator.Run(connectionString))
            {
                throw new InvalidOperationException("Database migration failed.");
            }

            app.UseMiddleware<CorrelationIdMiddleware>();
            app.UseExceptionHandler(exceptionHandlerApp =>
            {
                exceptionHandlerApp.Run(async context =>
                {
                    var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
                    {
                        Type = ProblemTypes.InternalError,
                        Title = "An unexpected error occurred.",
                        Status = StatusCodes.Status500InternalServerError,
                        Detail = "An unhandled exception has occurred. Use the trace identifier when contacting support.",
                        Instance = context.Request.Path,
                        Extensions = { ["traceId"] = context.TraceIdentifier }
                    };
                    context.Response.StatusCode = problem.Status ?? 500;
                    context.Response.ContentType = "application/problem+json";
                    await context.Response.WriteAsJsonAsync(problem);
                });
            });

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ArchiForge API v1");
                });
            }

            app.UseHttpsRedirection();

            app.UseCors("ArchiForge");

            app.UseRateLimiter();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapHealthChecks("/health");
            if (prometheusEnabled)
            {
                app.UseOpenTelemetryPrometheusScrapingEndpoint();
            }
            app.MapControllers();

            app.Run();
        }
    }
}

public partial class Program { }
