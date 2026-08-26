using System.Globalization;
using System.Text;
using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses <c>terraform show -json</c> state output (Terraform JSON state representation) into
///     <see cref="CanonicalObject" /> rows aligned with other infrastructure declaration parsers.
/// </summary>
/// <remarks>
///     Clients paste the JSON into <see cref="InfrastructureDeclarationReference.Content" /> with
///     <see cref="InfrastructureDeclarationReference.Format" /> <c>terraform-show-json</c>.
/// </remarks>
public sealed class TerraformShowJsonInfrastructureDeclarationParser(
    ILogger<TerraformShowJsonInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "terraform-show-json", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        List<CanonicalObject> results = [];
        Dictionary<string, int> labelTotals = [];
        Dictionary<string, int> labelSeen = new(StringComparer.OrdinalIgnoreCase);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(declaration.Content);
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("values", out JsonElement values))
            {
                logger.LogWarning(
                    "Infrastructure declaration '{Name}' (terraform-show-json) has no 'values' root; expected terraform state JSON.",
                    declaration.Name);

                return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
            }

            if (values.TryGetProperty("root_module", out JsonElement rootModule))
            {
                labelTotals = CountTerraformLabelOccurrences(rootModule);
                CollectFromModule(rootModule, moduleAddress: string.Empty, declaration, results, labelTotals, labelSeen);
            }
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as terraform-show-json; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static void CollectFromModule(
        JsonElement module,
        string moduleAddress,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen)
    {
        if (module.TryGetProperty("resources", out JsonElement resources) && resources.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement res in resources.EnumerateArray())
                TryAddResource(res, moduleAddress, declaration, results, labelTotals, labelSeen);
        }

        if (!module.TryGetProperty("child_modules", out JsonElement children) ||
            children.ValueKind != JsonValueKind.Array)
            return;

        foreach (JsonElement child in children.EnumerateArray())
            CollectFromModule(child, ResolveModuleAddress(child), declaration, results, labelTotals, labelSeen);
    }

    private static Dictionary<string, int> CountTerraformLabelOccurrences(JsonElement rootModule)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);
        CountModuleLabelOccurrences(rootModule, moduleAddress: string.Empty, counts);

        return counts;
    }

    private static void CountModuleLabelOccurrences(
        JsonElement module,
        string moduleAddress,
        Dictionary<string, int> counts)
    {
        if (module.TryGetProperty("resources", out JsonElement resources) && resources.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement res in resources.EnumerateArray())
            {
                if (TryGetResourceAddress(res, out _))
                    continue;

                if (!res.TryGetProperty("type", out JsonElement typeEl) || typeEl.ValueKind != JsonValueKind.String)
                    continue;

                string tfType = typeEl.GetString() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(tfType))
                    continue;

                if (!res.TryGetProperty("name", out JsonElement nameEl) || nameEl.ValueKind != JsonValueKind.String)
                    continue;

                string name = (nameEl.GetString() ?? string.Empty).Trim();

                if (string.IsNullOrWhiteSpace(name))
                    continue;

                string labelKey = BuildTerraformLabelKey(moduleAddress, tfType, name);
                counts[labelKey] = counts.GetValueOrDefault(labelKey) + 1;
            }
        }

        if (!module.TryGetProperty("child_modules", out JsonElement children) ||
            children.ValueKind != JsonValueKind.Array)
            return;

        foreach (JsonElement child in children.EnumerateArray())
            CountModuleLabelOccurrences(child, ResolveModuleAddress(child), counts);
    }

    private static string BuildTerraformLabelKey(string moduleAddress, string terraformType, string label)
    {
        string canonicalTerraformType = terraformType.Trim().ToLowerInvariant();
        string canonicalLabel = label.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(moduleAddress))
            return $"{canonicalTerraformType}|{canonicalLabel}";

        return $"{moduleAddress}|{canonicalTerraformType}|{canonicalLabel}";
    }

    private static string ResolveModuleAddress(JsonElement module)
    {
        if (!module.TryGetProperty("address", out JsonElement addressElement) ||
            addressElement.ValueKind != JsonValueKind.String)
            return string.Empty;

        string? address = addressElement.GetString();

        return string.IsNullOrWhiteSpace(address) ? string.Empty : address.Trim().ToLowerInvariant();
    }

    private static bool TryGetResourceAddress(JsonElement res, out string canonicalAddress)
    {
        canonicalAddress = string.Empty;

        if (!res.TryGetProperty("address", out JsonElement addressElement) ||
            addressElement.ValueKind != JsonValueKind.String)
            return false;

        string? address = addressElement.GetString();

        if (string.IsNullOrWhiteSpace(address))
            return false;

        canonicalAddress = address.Trim().ToLowerInvariant();

        return true;
    }

    private static string BuildTerraformResourceAddress(
        string moduleAddress,
        string canonicalTerraformType,
        string canonicalLabel)
    {
        if (!string.IsNullOrWhiteSpace(moduleAddress))
            return $"{moduleAddress}.{canonicalTerraformType}.{canonicalLabel}";

        return $"{canonicalTerraformType}.{canonicalLabel}";
    }

    private static string BuildTerraformResourceIdentity(
        string moduleAddress,
        string canonicalTerraformType,
        string canonicalLabel,
        string canonicalAddress,
        bool hasExplicitResourceAddress)
    {
        if (hasExplicitResourceAddress || !string.IsNullOrWhiteSpace(moduleAddress))
            return canonicalAddress;

        return $"{canonicalTerraformType}|{canonicalLabel}";
    }

    private static void TryAddResource(
        JsonElement res,
        string moduleAddress,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen)
    {
        if (!res.TryGetProperty("type", out JsonElement typeEl) || typeEl.ValueKind != JsonValueKind.String)
            return;

        string tfType = typeEl.GetString() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tfType))
            return;

        if (!res.TryGetProperty("name", out JsonElement nameEl) || nameEl.ValueKind != JsonValueKind.String)
            return;

        string name = (nameEl.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name))
            return;

        string objectType = ResolveObjectTypeFromTerraformType(tfType);
        string canonicalTerraformType = tfType.ToLowerInvariant();

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = canonicalTerraformType
        };

        if (res.TryGetProperty("provider_name", out JsonElement prov) && prov.ValueKind == JsonValueKind.String)
        {
            string? p = prov.GetString();

            if (!string.IsNullOrWhiteSpace(p))
                properties["providerName"] = p.ToLowerInvariant();
        }

        if (res.TryGetProperty("mode", out JsonElement mode) && mode.ValueKind == JsonValueKind.String)
        {
            string? m = mode.GetString();

            if (!string.IsNullOrWhiteSpace(m))
                properties["mode"] = m.ToLowerInvariant();
        }

        if (res.TryGetProperty("values", out JsonElement values) && values.ValueKind == JsonValueKind.Object)
        {
            foreach (JsonProperty prop in values.EnumerateObject())
            {
                if (CanonicalInfrastructurePropertyBag.CountTfProperties(properties)
                    >= CanonicalInfrastructurePropertyBag.MaxTfPropertyCount)
                    break;

                string key = CanonicalInfrastructurePropertyBag.SanitizePropertyKey(prop.Name).ToLowerInvariant();

                if (string.IsNullOrEmpty(key))
                    continue;

                string valueText = CanonicalizeTerraformValueText(prop.Value);

                if (string.IsNullOrWhiteSpace(valueText))
                    continue;

                properties[$"tf.{key}"] = valueText.Length > 512 ? valueText[..512] : valueText;
            }

            if (res.TryGetProperty("sensitive_values", out JsonElement sensitive) && sensitive.ValueKind == JsonValueKind.Object)
                RedactTopLevelSensitiveTfValues(sensitive, properties);
        }

        if (res.TryGetProperty("depends_on", out JsonElement depOn) && depOn.ValueKind == JsonValueKind.Array)
        {
            List<string> refs = [];

            foreach (JsonElement dep in depOn.EnumerateArray())
            {
                if (dep.ValueKind != JsonValueKind.String)
                    continue;

                string? r = dep.GetString();

                if (!string.IsNullOrWhiteSpace(r))
                    refs.Add(r.Trim().ToLowerInvariant());
            }

            if (refs.Count > 0)
            {
                string joined = string.Join('|', refs.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["terraformDependsOn"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        string canonicalLabel = name.ToLowerInvariant();
        bool hasExplicitResourceAddress = TryGetResourceAddress(res, out string canonicalAddress);

        if (!hasExplicitResourceAddress)
        {
            canonicalAddress = BuildTerraformResourceAddress(
                moduleAddress,
                canonicalTerraformType,
                canonicalLabel);
        }

        string resourceIdentity = BuildTerraformResourceIdentity(
            moduleAddress,
            canonicalTerraformType,
            canonicalLabel,
            canonicalAddress,
            hasExplicitResourceAddress);

        if (!hasExplicitResourceAddress)
        {
            string labelKey = BuildTerraformLabelKey(moduleAddress, canonicalTerraformType, canonicalLabel);

            if (labelTotals.TryGetValue(labelKey, out int total) && total > 1)
            {
                int occurrence = labelSeen.GetValueOrDefault(labelKey) + 1;
                labelSeen[labelKey] = occurrence;
                resourceIdentity = $"{resourceIdentity}|occurrence:{occurrence}";
                properties["terraformOccurrence"] = occurrence.ToString(CultureInfo.InvariantCulture);
            }
        }

        results.Add(new CanonicalObject
        {
            ObjectId = InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
                declaration.DeclarationId,
                objectType,
                resourceIdentity),
            ObjectType = objectType,
            Name = canonicalAddress,
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });
    }

    private static string CanonicalizeTerraformValueText(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => (value.GetString() ?? string.Empty).Trim().ToLowerInvariant(),
            JsonValueKind.Number => CanonicalizeTerraformNumberText(value),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            JsonValueKind.Object => SerializeCanonicalJson(value),
            JsonValueKind.Array => SerializeCanonicalJson(value),
            _ => value.GetRawText()
        };
    }

    private static string SerializeCanonicalJson(JsonElement value)
    {
        using MemoryStream stream = new();
        using Utf8JsonWriter writer = new(stream);
        WriteCanonicalJsonValue(writer, value);
        writer.Flush();

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static void WriteCanonicalJsonValue(Utf8JsonWriter writer, JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
                writer.WriteStringValue((value.GetString() ?? string.Empty).Trim().ToLowerInvariant());
                break;

            case JsonValueKind.Number:
                writer.WriteRawValue(CanonicalizeTerraformNumberText(value));
                break;

            case JsonValueKind.True:
                writer.WriteBooleanValue(true);
                break;

            case JsonValueKind.False:
                writer.WriteBooleanValue(false);
                break;

            case JsonValueKind.Null:
                writer.WriteNullValue();
                break;

            case JsonValueKind.Object:
                writer.WriteStartObject();

                foreach (JsonProperty property in value.EnumerateObject()
                             .OrderBy(static property => property.Name, StringComparer.OrdinalIgnoreCase))
                {
                    writer.WritePropertyName(property.Name.ToLowerInvariant());
                    WriteCanonicalJsonValue(writer, property.Value);
                }

                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();

                foreach (JsonElement item in value.EnumerateArray())
                    WriteCanonicalJsonValue(writer, item);

                writer.WriteEndArray();
                break;

            default:
                writer.WriteRawValue(value.GetRawText());
                break;
        }
    }

    private static string CanonicalizeTerraformNumberText(JsonElement value)
        => CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(value);

    private static void RedactTopLevelSensitiveTfValues(
        JsonElement sensitiveRoot,
        Dictionary<string, string> properties)
    {
        foreach (string? pk in from sp in sensitiveRoot.EnumerateObject() where sp.Value.ValueKind == JsonValueKind.True select CanonicalInfrastructurePropertyBag.SanitizePropertyKey(sp.Name) into k where !string.IsNullOrEmpty(k) select $"tf.{k}" into pk where properties.ContainsKey(pk) select pk)
        {
            properties[pk] = "[REDACTED]";
        }
    }

    private static string ResolveObjectTypeFromTerraformType(string tfType)
    {
        ReadOnlySpan<char> s = tfType.AsSpan();
        int slash = s.LastIndexOf('/');
        ReadOnlySpan<char> tail = slash >= 0 ? s[(slash + 1)..] : s;

        return tail.ToString().ToLowerInvariant() switch
        {
            "azurerm_key_vault" or "azurerm_firewall" or "azurerm_network_security_group"
                or "azurerm_key_vault_access_policy"
                or "aws_security_group" or "aws_network_acl" or "aws_wafv2_web_acl"
                or "google_compute_firewall" =>
                "SecurityBaseline",
            "azurerm_policy_assignment" or "azurerm_policy_definition" => "PolicyControl",
            // Common Azure topology nodes (explicit for assessor traceability; still TopologyResource-shaped)
            "azurerm_resource_group" or "azurerm_app_service" or "azurerm_linux_web_app"
                or "azurerm_windows_web_app" or "azurerm_sql_server" or "azurerm_mssql_server"
                or "azurerm_storage_account" or "azurerm_virtual_network" or "azurerm_subnet"
                or "aws_instance" or "aws_lambda_function" or "aws_eks_cluster" or "aws_db_instance"
                or "aws_rds_cluster" or "aws_s3_bucket" or "aws_vpc" or "aws_subnet"
                or "google_compute_instance" or "google_container_cluster" or "google_sql_database_instance"
                or "google_storage_bucket" or "google_compute_network" or "google_compute_subnetwork" =>
                "TopologyResource",
            _ => "TopologyResource"
        };
    }
}
