using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="RuntimePlatform" /> from enum names, integers, and common Azure aliases from live LLM output.
/// </summary>
public sealed class RuntimePlatformJsonConverter : JsonConverter<RuntimePlatform>
{
    public override RuntimePlatform Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return (RuntimePlatform)reader.GetInt32();

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for runtime platform.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return RuntimePlatform.Unknown;

        if (Enum.TryParse(raw, ignoreCase: true, out RuntimePlatform parsed))
            return parsed;

        string normalized = raw.Trim().ToLowerInvariant().Replace(" ", string.Empty).Replace("-", string.Empty);

        return normalized switch
        {
            "appservice" or "azureappservice" or "webapp" => RuntimePlatform.AppService,
            "function" or "functions" or "azurefunctions" => RuntimePlatform.Functions,
            "aks" or "kubernetes" or "azurekubernetes" => RuntimePlatform.Aks,
            "vm" or "virtualmachine" or "azurevm" => RuntimePlatform.Vm,
            "containerapps" or "azurecontainerapps" or "aca" => RuntimePlatform.ContainerApps,
            "sql" or "sqlserver" or "azuresql" or "azuresqldatabase" or "sqldatabase" => RuntimePlatform.SqlServer,
            "azureaisearch" or "cognitivesearch" or "search" => RuntimePlatform.AzureAiSearch,
            "azureopenai" or "openai" or "aoai" => RuntimePlatform.AzureOpenAi,
            "redis" or "azureredis" or "cacheforredis" or "azurecacheforredis" => RuntimePlatform.Redis,
            "blob" or "blobstorage" or "azureblob" or "storage" => RuntimePlatform.BlobStorage,
            "keyvault" or "azurekeyvault" => RuntimePlatform.KeyVault,
            _ => RuntimePlatform.Unknown,
        };
    }

    public override void Write(Utf8JsonWriter writer, RuntimePlatform value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
