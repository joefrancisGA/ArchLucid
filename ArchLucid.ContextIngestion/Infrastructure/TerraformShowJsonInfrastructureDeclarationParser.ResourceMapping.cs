using System.Globalization;
using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

public sealed partial class TerraformShowJsonInfrastructureDeclarationParser
{
    private static string BuildTerraformLabelKey(string moduleAddress, string terraformType, string label)
    {
        string canonicalTerraformType = terraformType.Trim().ToLowerInvariant();
        string canonicalLabel = label.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(moduleAddress))
            return $"{canonicalTerraformType}|{canonicalLabel}";

        return $"{moduleAddress}|{canonicalTerraformType}|{canonicalLabel}";
    }

    private static bool TryGetResourceAddress(JsonElement res, out string canonicalAddress)
    {
        canonicalAddress = string.Empty;

        if (!TryGetPropertyIgnoreCase(res, "address", out JsonElement addressElement) ||
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
        if (!TryGetPropertyIgnoreCase(res, "type", out JsonElement typeEl) || typeEl.ValueKind != JsonValueKind.String)
            return;

        string tfType = (typeEl.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(tfType))
            return;

        if (!TryGetPropertyIgnoreCase(res, "name", out JsonElement nameEl) || nameEl.ValueKind != JsonValueKind.String)
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

        if (TryGetPropertyIgnoreCase(res, "provider_name", out JsonElement prov) && prov.ValueKind == JsonValueKind.String)
        {
            string? p = prov.GetString();

            if (!string.IsNullOrWhiteSpace(p))
                properties["providerName"] = p.ToLowerInvariant();
        }

        if (TryGetPropertyIgnoreCase(res, "mode", out JsonElement mode) && mode.ValueKind == JsonValueKind.String)
        {
            string? m = mode.GetString();

            if (!string.IsNullOrWhiteSpace(m))
                properties["mode"] = m.ToLowerInvariant();
        }

        if (TryGetPropertyIgnoreCase(res, "values", out JsonElement values) && values.ValueKind == JsonValueKind.Object)
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

            if (TryGetPropertyIgnoreCase(res, "sensitive_values", out JsonElement sensitive) && sensitive.ValueKind == JsonValueKind.Object)
                RedactTopLevelSensitiveTfValues(sensitive, properties);
        }

        if (TryGetPropertyIgnoreCase(res, "depends_on", out JsonElement depOn) && depOn.ValueKind == JsonValueKind.Array)
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
