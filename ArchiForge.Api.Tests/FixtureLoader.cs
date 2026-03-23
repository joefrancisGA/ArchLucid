using System.Text.Json;

namespace ArchiForge.Api.Tests;

public static class FixtureLoader
{
    public static T Load<T>(string relativePath)
    {
        var fullPath = Path.Combine(AppContext.BaseDirectory, "fixtures", relativePath);

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Fixture file not found: {fullPath}");

        var json = File.ReadAllText(fullPath);

        var result = JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (result is null)
            throw new InvalidOperationException($"Failed to deserialize fixture: {relativePath}");

        return result;
    }
}
