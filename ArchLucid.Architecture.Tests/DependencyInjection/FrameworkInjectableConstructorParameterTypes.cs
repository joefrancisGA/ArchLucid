using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Architecture.Tests.DependencyInjection;

/// <summary>
///     Constructor parameter types registered by ASP.NET Core / Microsoft.Extensions.* and not product composition.
/// </summary>
internal static class FrameworkInjectableConstructorParameterTypes
{
    public static bool IsExempt(Type parameterType)
    {
        ArgumentNullException.ThrowIfNull(parameterType);

        Type type = Nullable.GetUnderlyingType(parameterType) ?? parameterType;

        if (type == typeof(IConfiguration)
            || type == typeof(IHostEnvironment)
            || type == typeof(IWebHostEnvironment)
            || type == typeof(IServiceProvider)
            || type == typeof(IServiceScopeFactory)
            || type == typeof(TimeProvider))
            return true;

        if (type == typeof(ILoggerFactory))
            return true;

        if (type.IsGenericType)
        {
            Type definition = type.GetGenericTypeDefinition();

            if (definition == typeof(ILogger<>)
                || definition == typeof(IOptions<>)
                || definition == typeof(IOptionsMonitor<>)
                || definition == typeof(IOptionsSnapshot<>))
                return true;
        }

        return type.Namespace is not null
               && type.Namespace.StartsWith("Microsoft.AspNetCore.", StringComparison.Ordinal);
    }
}
