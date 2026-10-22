using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace ArchLucid.Api.Serialization;

/// <summary>
///     Registers per-slice source-generated <see cref="JsonSerializerContext" /> instances before reflection fallback
///     (TB-2162).
/// </summary>
internal static class ArchLucidApiJsonTypeInfoResolverChain
{
    internal static void Apply(JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.TypeInfoResolverChain.Any(static resolver => resolver == AuthApiJsonSerializerContext.Default))
            return;

        options.TypeInfoResolverChain.Add(AuthApiJsonSerializerContext.Default);
        options.TypeInfoResolverChain.Add(RunsApiJsonSerializerContext.Default);
        options.TypeInfoResolverChain.Add(FindingsApiJsonSerializerContext.Default);
        options.TypeInfoResolverChain.Add(AuditApiJsonSerializerContext.Default);
        options.TypeInfoResolverChain.Add(ProblemDetailsApiJsonSerializerContext.Default);
        options.TypeInfoResolverChain.Add(new DefaultJsonTypeInfoResolver());
    }
}
