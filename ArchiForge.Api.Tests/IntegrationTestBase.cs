using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchiForge.Api.Tests;

public class IntegrationTestBase(ArchiForgeApiFactory factory) : IClassFixture<ArchiForgeApiFactory>
{
    protected readonly HttpClient Client = factory.CreateClient();

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
