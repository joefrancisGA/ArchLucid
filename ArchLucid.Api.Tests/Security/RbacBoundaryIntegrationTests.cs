using System.Net;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     RBAC boundary: every controller HTTP action must have [AllowAnonymous] or [Authorize] on the action or
///     controller (including class-level authenticate-only <c>[Authorize]</c> used by several tenancy/billing surfaces),
///     and protected routed actions must return 401/403 for unauthenticated callers when hosted with API-key auth and
///     development bypass disabled (<see cref="ApiKeyReaderAndAdminArchLucidApiFactory" />).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class RbacBoundaryIntegrationTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly Assembly ApiAssembly = typeof(Program).Assembly;

    private static readonly Regex RouteBraceTokenRegex = new(@"\{([^}]+)\}", RegexOptions.Compiled);

    [SkippableFact]
    public void All_public_controller_http_actions_declare_authorization_boundary()
    {
        List<string> violations = [];
        violations.AddRange(from type in DiscoverArchLucidApiControllerTypes() from method in type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly) where method.GetCustomAttribute<NonActionAttribute>(false) is null where MethodDeclaresHttpVerb(method) where !MethodOrTypeAllowsAnonymous(type, method) where !TypeOrMethodRequiresAuthentication(type, method) select $"{type.FullName}.{method.Name}: HTTP action has no [AllowAnonymous] and no [Authorize] (named or plain) on method or controller.");

        violations.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Unauthenticated_requests_to_protected_controller_endpoints_return_401_or_403()
    {
        EndpointDataSource dataSource = factory.Services.GetRequiredService<EndpointDataSource>();
        using HttpClient client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        List<string> failures = [];
        List<string> skipped = [];
        HashSet<string> visited = [];

        foreach (Endpoint endpoint in dataSource.Endpoints)
        {
            if (endpoint is not RouteEndpoint routeEndpoint)
            {
                continue;
            }

            ControllerActionDescriptor? action = endpoint.Metadata.GetMetadata<ControllerActionDescriptor>();

            if (action is null)
            {
                continue;
            }

            string? ns = action.ControllerTypeInfo.Namespace;

            if (ns is null || !ns.Contains("ArchLucid.Api.Controllers", StringComparison.Ordinal))
            {
                continue;
            }

            if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null)
            {
                continue;
            }

            IReadOnlyList<string>? httpMethods = endpoint.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods;

            if (httpMethods is null || httpMethods.Count == 0)
            {
                skipped.Add($"{action.ControllerName}.{action.ActionName}: no HttpMethodMetadata.");
                continue;
            }

            string? path = TryBuildUrlFromRouteEndpoint(routeEndpoint, out string? buildReason);

            if (path is null)
            {
                skipped.Add($"{action.ControllerName}.{action.ActionName}: {buildReason}");
                continue;
            }

            foreach (string methodText in httpMethods)
            {
                string visitKey = $"{methodText}\u001f{path}";

                if (!visited.Add(visitKey))
                {
                    continue;
                }

                HttpResponseMessage response = await SendAsync(client, methodText, path);

                try
                {
                    if (response.StatusCode is not HttpStatusCode.Unauthorized and not HttpStatusCode.Forbidden)
                    {
                        failures.Add(
                            $"{methodText} {path} ({action.ControllerName}.{action.ActionName}) => {(int)response.StatusCode} {response.StatusCode}");
                    }
                }
                finally
                {
                    response.Dispose();
                }
            }
        }

        skipped.Should().BeEmpty(
            "Every ArchLucid.Api.Controllers action endpoint must resolve a probe URL (fix template resolution or add an explicit exception with justification).");

        failures.Should().BeEmpty();
    }

    private static IEnumerable<Type> DiscoverArchLucidApiControllerTypes()
    {
        foreach (Type type in ApiAssembly.GetTypes())
        {
            if (!type.IsClass || type.IsAbstract || !type.IsPublic)
            {
                continue;
            }

            if (!typeof(ControllerBase).IsAssignableFrom(type))
            {
                continue;
            }

            if (type.Namespace is null ||
                !type.Namespace.Contains("ArchLucid.Api.Controllers", StringComparison.Ordinal))
            {
                continue;
            }

            yield return type;
        }
    }

    private static bool MethodDeclaresHttpVerb(MethodInfo method)
    {
        if (method.GetCustomAttributes(true).Any(attribute =>
                attribute is HttpGetAttribute or HttpPostAttribute or HttpPutAttribute or HttpPatchAttribute
                    or HttpDeleteAttribute or HttpHeadAttribute))
        {
            return true;
        }

        return method.GetCustomAttribute<AcceptVerbsAttribute>() is not null;
    }

    private static bool MethodOrTypeAllowsAnonymous(Type controllerType, MethodInfo method)
    {
        if (method.GetCustomAttribute<AllowAnonymousAttribute>(true) is not null)
        {
            return true;
        }

        return controllerType.GetCustomAttribute<AllowAnonymousAttribute>(true) is not null;
    }

    private static bool TypeOrMethodRequiresAuthentication(Type controllerType, MethodInfo method)
    {
        return method.GetCustomAttributes<AuthorizeAttribute>(false).Any() || controllerType.GetCustomAttributes<AuthorizeAttribute>(true).Any();
    }

    private static string? TryBuildUrlFromRouteEndpoint(RouteEndpoint routeEndpoint, out string? failureReason)
    {
        failureReason = null;

        // RoutePattern types are not exposed to this test assembly's compile graph; RawText is enough to build probe URLs.
        dynamic dynamicRouteEndpoint = routeEndpoint;
        object routePatternObject = dynamicRouteEndpoint.RoutePattern;
        dynamic routePatternDynamic = routePatternObject;
        string? rawText = routePatternDynamic.RawText as string;

        if (!string.IsNullOrWhiteSpace(rawText))
            return ExpandRawRouteTemplate(rawText, out failureReason);

        failureReason = "route pattern RawText was empty.";

        return null;

    }

    private static string? ExpandRawRouteTemplate(string rawText, out string? failureReason)
    {
        failureReason = null;
        string working = rawText.Trim();

        if (working.StartsWith("~/", StringComparison.Ordinal))
        {
            working = working[2..];
        }

        Match match = RouteBraceTokenRegex.Match(working);
        StringBuilder builder = new(working.Length + 16);
        int lastIndex = 0;

        while (match.Success)
        {
            string inner = match.Groups[1].Value.Trim();

            if (inner.StartsWith("**", StringComparison.Ordinal) || inner.StartsWith('*'))
            {
                failureReason = $"catch-all route parameter in template '{rawText}'";

                return null;
            }

            if (inner.EndsWith('?'))
            {
                inner = inner[..^1];
            }

            int colon = inner.IndexOf(':');
            string paramName = colon >= 0 ? inner[..colon] : inner;
            string constraint = colon >= 0 ? inner[(colon + 1)..] : string.Empty;

            builder.Append(working.AsSpan(lastIndex, match.Index - lastIndex));

            if (!TryExpandRouteParameterToken(paramName, constraint, out string? token, out string? resolveReason))
            {
                failureReason = resolveReason;

                return null;
            }

            builder.Append(token);
            lastIndex = match.Index + match.Length;
            match = match.NextMatch();
        }

        builder.Append(working.AsSpan(lastIndex, working.Length - lastIndex));
        string path = builder.ToString();

        if (!path.StartsWith('/'))
        {
            path = "/" + path;
        }

        while (path.Contains("//", StringComparison.Ordinal))
        {
            path = path.Replace("//", "/", StringComparison.Ordinal);
        }

        if (path.Length > 1 && path.EndsWith('/'))
        {
            path = path.TrimEnd('/');
        }

        return path;
    }

    private static bool TryExpandRouteParameterToken(
        string name,
        string constraint,
        out string? value,
        out string? failureReason)
    {
        failureReason = null;
        value = null;

        if (string.Equals(name, "version", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(name, "apiVersion", StringComparison.OrdinalIgnoreCase))
        {
            value = "1";

            return true;
        }

        bool constraintHasGuid =
            constraint.Contains("guid", StringComparison.OrdinalIgnoreCase);

        bool constraintHasInt =
            constraint.Contains("int", StringComparison.OrdinalIgnoreCase);

        bool constraintHasLong =
            constraint.Contains("long", StringComparison.OrdinalIgnoreCase);

        if (constraintHasGuid || constraintHasInt || constraintHasLong)
        {
            if (constraintHasGuid)
            {
                value = "00000000-0000-0000-0000-000000000000";

                return true;
            }

            value = "0";

            return true;
        }

        if (name.EndsWith("Id", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(name, "runId", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(name, "planId", StringComparison.OrdinalIgnoreCase))
        {
            value = "00000000-0000-0000-0000-000000000000";

            return true;
        }

        if (string.Equals(name, "manifestVersion", StringComparison.OrdinalIgnoreCase))
        {
            value = "v1";

            return true;
        }

        if (string.Equals(name, "decisionKey", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(name, "key", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(name, "slug", StringComparison.OrdinalIgnoreCase))
        {
            value = "rbac-probe";

            return true;
        }

        if (string.Equals(name, "format", StringComparison.OrdinalIgnoreCase))
        {
            value = "docx";

            return true;
        }

        failureReason = $"unsupported route parameter '{name}' (constraint '{constraint}')";

        return false;
    }

    private static async Task<HttpResponseMessage> SendAsync(HttpClient client, string methodText, string path)
    {
        HttpMethod method = new(methodText);
        using HttpRequestMessage request = new(method, path);

        if (method == HttpMethod.Post || method == HttpMethod.Put || method == HttpMethod.Patch)
        {
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
        }

        return await client.SendAsync(request);
    }
}
