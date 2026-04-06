using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchiForge.Api.Tests;

/// <summary>
/// Base for API integration tests: provides an <see cref="HttpClient"/> from <see cref="ArchiForgeApiFactory"/> and JSON helpers aligned with the API’s serializer settings.
/// </summary>
public class IntegrationTestBase(ArchiForgeApiFactory factory) : IClassFixture<ArchiForgeApiFactory>
{
    /// <summary>Factory for the hosted API (singleton services, SQL connection string, etc.).</summary>
    protected ArchiForgeApiFactory Factory { get; } = factory;

    protected readonly HttpClient Client = factory.CreateClient();

    /// <summary>
    /// Serializes <paramref name="value"/> with <see cref="JsonOptions"/> and returns <see cref="StringContent"/> suitable for <c>application/json</c> POST bodies.
    /// </summary>
    protected StringContent JsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    /// <summary>Aligned with <see cref="ArchiForge.Api.Startup.MvcExtensions"/> API JSON options (camelCase properties, string enums).</summary>
    protected readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: true) }
    };
}
