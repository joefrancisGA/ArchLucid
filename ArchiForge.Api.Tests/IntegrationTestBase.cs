using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;


public class IntegrationTestBase : IClassFixture<ArchiForgeApiFactory>
{
    protected readonly HttpClient Client;

    public IntegrationTestBase(ArchiForgeApiFactory factory)
    {
        Client = factory.CreateClient();
    }

    protected StringContent JsonContent(object value)
    {
        var json = JsonSerializer.Serialize(value, new JsonOptions().JsonSerializerOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}