using System.Text.Json;
using ArchLucid.Api.Serialization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Authority;

public sealed class IdempotencyFilterAttribute : ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue("Idempotency-Key", out StringValues rawKey) || string.IsNullOrWhiteSpace(rawKey.ToString()))
        {
            await next();
            return;
        }

        string idempotencyKey = rawKey.ToString().Trim();
        IScopeContextProvider scopeProvider = context.HttpContext.RequestServices.GetRequiredService<IScopeContextProvider>();
        IIdempotencyRecordRepository repository = context.HttpContext.RequestServices.GetRequiredService<IIdempotencyRecordRepository>();
        
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IdempotencyRecordRow? existing = await repository.TryGetAsync(scope.TenantId, idempotencyKey, context.HttpContext.RequestAborted);
        if (existing != null)
        {
            context.HttpContext.Response.Headers.Append("X-Idempotency-Replayed", "true");
            
            // Reconstruct the response
            ContentResult contentResult = new ContentResult
            {
                Content = existing.ResponseBody,
                ContentType = "application/json",
                StatusCode = existing.StatusCode
            };
            
            context.Result = contentResult;
            return;
        }

        ActionExecutedContext executedContext = await next();

        if (executedContext.Exception == null && executedContext.Result != null)
        {
            if (executedContext.Result is ObjectResult objectResult)
            {
                string json = JsonSerializer.Serialize(objectResult.Value, ArchLucidApiJsonSerializerOptions.Web);
                await repository.TryInsertAsync(scope.TenantId, idempotencyKey, objectResult.StatusCode ?? 200, json, context.HttpContext.RequestAborted);
            }
            else if (executedContext.Result is ContentResult contentResult && contentResult.Content != null)
            {
                await repository.TryInsertAsync(scope.TenantId, idempotencyKey, contentResult.StatusCode ?? 200, contentResult.Content, context.HttpContext.RequestAborted);
            }
            else if (executedContext.Result is StatusCodeResult statusCodeResult)
            {
                await repository.TryInsertAsync(scope.TenantId, idempotencyKey, statusCodeResult.StatusCode, "{}", context.HttpContext.RequestAborted);
            }
        }
    }
}
