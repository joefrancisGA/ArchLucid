using System.Diagnostics;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Diagnostics;
using ArchLucid.Api.Middleware;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Middleware;
using ArchLucid.Host.Core.OperationalErrors;

using Microsoft.AspNetCore.Diagnostics;

using Scalar.AspNetCore;

namespace ArchLucid.Api.Startup;

internal static partial class PipelineExtensions
{
    /// <summary>
    ///     Middleware through <c>UseCors</c> (includes <c>UseRouting</c>).
    ///     Call <c>UseSerilogRequestLogging</c> in <c>Program.cs</c> immediately after this, then
    ///     <see cref="UseArchLucidPipelineAfterSerilogRequestLogging" />.
    /// </summary>
    public static WebApplication UseArchLucidPipelineBeforeSerilogRequestLogging(this WebApplication app)
    {
        app.UseMiddleware<CorrelationIdMiddleware>();
        // Before auth or body-reading middleware: correlate first, then safe structured lifecycle logs only.
        app.UseMiddleware<HttpRequestLoggingMiddleware>();
        app.UseMiddleware<ContextIngestionMaxPayloadMiddleware>();
        app.UseMiddleware<TraceResponseHeaderMiddleware>();
        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseMiddleware<ApiDeprecationHeadersMiddleware>();
        app.UseExceptionHandler(exceptionHandlerApp =>
        {
            exceptionHandlerApp.Run(async context =>
            {
                IExceptionHandlerFeature? exceptionFeature = context.Features
                    .Get<IExceptionHandlerFeature>();

                if (exceptionFeature?.Error is { } ex)
                {
                    await ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit(
                        context,
                        ex,
                        context.RequestAborted);

                    ILogger<WebApplication> logger = context.RequestServices
                        .GetRequiredService<ILogger<WebApplication>>();

                    if (logger.IsEnabled(LogLevel.Error))
                    {
                        logger.LogErrorUnhandledWorkerHttpRequest(
                            ex,
                            context.Request.Method,
                            context.Request.Path
                                .Value); // codeql[cs/log-forging]: user-derived method/path are normalized in LogErrorUnhandledWorkerHttpRequest (CWE-117, LogSanitizer; see SanitizedLoggerErrorExtensions and docs/library/CODEQL_TRIAGE.md).
                    }

                    IOperationalErrorCaptureService? captureService =
                        context.RequestServices.GetService<IOperationalErrorCaptureService>();

                    if (captureService is not null)
                    {
                        OperationalErrorHttpCapture.TryCaptureFromException(
                            captureService,
                            context,
                            ex,
                            StatusCodes.Status500InternalServerError,
                            ProblemTypes.InternalError,
                            OperationalErrorSource.Api,
                            OperationalErrorCategory.UnhandledException);
                    }
                }

                Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
                {
                    Type = ProblemTypes.InternalError,
                    Title = "An unexpected error occurred.",
                    Status = StatusCodes.Status500InternalServerError,
                    Detail =
                        "An unhandled exception has occurred. Use the correlationId value in this response (and the X-Correlation-ID header) when contacting support.",
                    Instance = context.Request.Path,
                    Extensions = { ["traceId"] = context.TraceIdentifier, ["traceParent"] = Activity.Current?.Id }
                };
                ProblemErrorCodes.AttachErrorCode(problem, ProblemTypes.InternalError);
                ProblemSupportHints.AttachForProblemType(problem);
                ProblemCorrelation.Attach(problem, context);

                if (!context.Response.Headers.ContainsKey(CorrelationIdHeaderParser.HeaderName))
                {
                    context.Response.Headers[CorrelationIdHeaderParser.HeaderName] = context.TraceIdentifier;
                }

                context.Response.StatusCode = problem.Status ?? 500;
                await context.Response.WriteAsJsonAsync(
                    problem,
                    options: null,
                    contentType: ApplicationProblemMapper.ProblemJsonMediaType);
            });
        });

        app.UseMiddleware<ProblemJsonContentTypeMiddleware>();

        // Canonical contract for APIM, CD smoke, and client codegen — always mapped (not gated on the explorer UI).
        app.MapOpenApi().AllowAnonymous();

        DeveloperExperienceOptions dxOptions = app.Configuration
            .GetSection(DeveloperExperienceOptions.SectionName)
            .Get<DeveloperExperienceOptions>() ?? new DeveloperExperienceOptions();

        bool enableApiExplorer = dxOptions.EnableApiExplorer || app.Environment.IsDevelopment();

        if (enableApiExplorer)
        {
            if (dxOptions.EnableApiExplorer && !app.Environment.IsDevelopment())

                if (app.Logger.IsEnabled(LogLevel.Warning))

                    app.Logger.LogWarning(
                        "DeveloperExperience:EnableApiExplorer is true in a non-Development environment. " +
                        "Ensure this is intentional and restrict access at the network perimeter.");

            app.UseSwagger();
            app.MapScalarApiReference(options =>
            {
                options.WithTitle("ArchLucid API Explorer");
                options.WithTheme(ScalarTheme.BluePlanet);
                options.WithOpenApiRoutePattern("/swagger/{documentName}/swagger.json");
                options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
            });
        }

        if (!app.Environment.IsDevelopment())
            app.UseHsts();

        if (AspNetCoreHostingUrls.ShouldUseHttpsRedirection(app.Configuration))
            app.UseHttpsRedirection();
        app.UseResponseCompression();
        app.UseRouting();
        app.UseCors("ArchLucid");

        if (app.Configuration.GetValue<bool>("OutputCache:Enabled", true))
            app.UseOutputCache();

        return app;
    }
}
