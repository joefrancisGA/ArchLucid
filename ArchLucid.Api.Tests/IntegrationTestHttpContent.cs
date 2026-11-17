using System.Text;
using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>JSON <see cref="HttpContent" /> aligned with API integration <see cref="JsonSerializerOptions" />.</summary>
public static class IntegrationTestHttpContent
{
    public static StringContent CreateJson(object value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(options);

        string json = JsonSerializer.Serialize(value, options);

        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
