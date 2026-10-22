using System.Text.Json;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Minimal Atlassian Document Format for Jira Cloud REST v3 description fields.</summary>
internal static class JiraAdfDescriptionBuilder
{
    private static readonly JsonSerializerOptions SerializerOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private static readonly string[] NewlineSeparators = ["\r\n", "\n"];

    public static JsonElement BuildDescriptionField(string? plainText)
    {
        string safe = plainText ?? string.Empty;
        List<object> content = [];
        string[] lines = safe.Split(NewlineSeparators, StringSplitOptions.None);

        foreach (string line in lines)
        {
            string t = line.Trim();

            if (t.Length is 0)
            {
                content.Add(new
                {
                    type = "paragraph",
                    content = Array.Empty<object>()
                });

                continue;
            }

            content.Add(
                new
                {
                    type = "paragraph",
                    content = new object[] { new { type = "text", text = t } }
                });
        }

        if (content.Count is 0)
            content.Add(new
            {
                type = "paragraph",
                content = Array.Empty<object>()
            });

        object root = new
        {
            type = "doc",
            version = 1,
            content
        };

        string json = JsonSerializer.Serialize(root, SerializerOptions);

        return JsonSerializer.Deserialize<JsonElement>(json);
    }
}
