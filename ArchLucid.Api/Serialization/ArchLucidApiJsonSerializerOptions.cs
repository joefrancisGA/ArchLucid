using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Api.Serialization;

/// <summary>
///     JSON options aligned with <c>AddArchLucidMvc().AddJsonOptions</c> for byte-stable serialization (ETags,
///     tests). Chains source-generated contexts before reflection fallback (TB-2162).
/// </summary>
internal static class ArchLucidApiJsonSerializerOptions
{
    public static readonly JsonSerializerOptions Web = Create();

    internal static void Configure(JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.PropertyNameCaseInsensitive = true;

        if (!options.Converters.Any(static converter => converter is ValidatedEnumJsonConverterFactory))
        {
            // Keep the configured stock converter's naming and numeric-token policy.
            // Wrap it at the same position so specific converters keep their precedence.
            int index = -1;
            for (int i = 0; i < options.Converters.Count; i++)
            {
                if (options.Converters[i] is JsonStringEnumConverter)
                {
                    index = i;
                    break;
                }
            }

            if (index >= 0)
                options.Converters[index] = new ValidatedEnumJsonConverterFactory((JsonStringEnumConverter)options.Converters[index]);
            else
                options.Converters.Add(new ValidatedEnumJsonConverterFactory(new JsonStringEnumConverter(null, allowIntegerValues: true)));
        }

        ArchLucidApiJsonTypeInfoResolverChain.Apply(options);
    }

    private static JsonSerializerOptions Create()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web);
        Configure(options);

        return options;
    }
}
