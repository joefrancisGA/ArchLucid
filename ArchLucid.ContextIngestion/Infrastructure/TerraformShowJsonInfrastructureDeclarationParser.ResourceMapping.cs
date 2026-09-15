using System.Globalization;
using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

public sealed partial class TerraformShowJsonInfrastructureDeclarationParser
{



    private static string ResolveResourceModuleAddress(JsonElement res, string moduleAddress)
    {
        string callerModuleAddress = ResolveCallerModuleAddress(res, moduleAddress);

        if ((TryGetPropertyIgnoreCase(res, "module", out JsonElement moduleElement)
                || TryGetPropertyIgnoreCase(res, "module_address", out moduleElement)
                || TryGetPropertyIgnoreCase(res, "moduleAddress", out moduleElement))
            && moduleElement.ValueKind == JsonValueKind.String)
        {
            string? embeddedModule = moduleElement.GetString();

            if (!string.IsNullOrWhiteSpace(embeddedModule))
                return embeddedModule.Trim().ToLowerInvariant();
        }

        return callerModuleAddress;
    }

    private static string ResolveCallerModuleAddress(JsonElement res, string moduleAddress)
    {
        if ((TryGetPropertyIgnoreCase(res, "caller_module_address", out JsonElement callerModule)
                || TryGetPropertyIgnoreCase(res, "callerModuleAddress", out callerModule))
            && callerModule.ValueKind == JsonValueKind.String)
        {
            string? caller = callerModule.GetString();

            if (!string.IsNullOrWhiteSpace(caller))
                return caller.Trim().ToLowerInvariant();
        }

        return moduleAddress;
    }


    private static bool IsDeposedTerraformResource(JsonElement res)
    {
        if (!TryGetPropertyIgnoreCase(res, "deposed", out JsonElement deposed))
            return false;

        if (deposed.ValueKind == JsonValueKind.Null)
            return false;

        if (deposed.ValueKind == JsonValueKind.String)
            return !string.IsNullOrWhiteSpace(deposed.GetString());

        return true;
    }

    private static bool TryResolveTerraformResourceLabel(JsonElement res, out string name)
    {
        name = string.Empty;

        if (TryGetPropertyIgnoreCase(res, "name", out JsonElement nameEl) && nameEl.ValueKind == JsonValueKind.String)
        {
            string? directName = nameEl.GetString();

            if (!string.IsNullOrWhiteSpace(directName))
            {
                name = directName.Trim();
                return true;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "resource_name", out JsonElement resourceNameEl)
                || TryGetPropertyIgnoreCase(res, "resourceName", out resourceNameEl))
            && resourceNameEl.ValueKind == JsonValueKind.String)
        {
            string? aliasName = resourceNameEl.GetString();

            if (!string.IsNullOrWhiteSpace(aliasName))
            {
                name = aliasName.Trim();
                return true;
            }
        }

        if (!TryGetResourceAddress(res, out string canonicalAddress))
            return false;

        int lastDot = canonicalAddress.LastIndexOf('.');

        if (lastDot < 0 || lastDot >= canonicalAddress.Length - 1)
            return false;

        string label = canonicalAddress[(lastDot + 1)..];
        int bracket = label.IndexOf('[');

        if (bracket > 0)
            label = label[..bracket];

        if (string.IsNullOrWhiteSpace(label))
            return false;

        name = label;
        return true;
    }

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

        if ((!TryGetPropertyIgnoreCase(res, "address", out JsonElement addressElement)
                && !TryGetPropertyIgnoreCase(res, "resourceAddress", out addressElement)
                && !TryGetPropertyIgnoreCase(res, "resource_address", out addressElement)
                && !TryGetPropertyIgnoreCase(res, "terraformAddress", out addressElement)
                && !TryGetPropertyIgnoreCase(res, "terraform_address", out addressElement))
            || addressElement.ValueKind != JsonValueKind.String)
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
        if (IsDeposedTerraformResource(res))
            return;

        if (!TryGetPropertyIgnoreCase(res, "type", out JsonElement typeEl) || typeEl.ValueKind != JsonValueKind.String)
            return;

        string tfType = (typeEl.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(tfType))
            return;

        if (!TryResolveTerraformResourceLabel(res, out string name))
            return;

        string objectType = ResolveObjectTypeFromTerraformType(tfType);
        string canonicalTerraformType = tfType.ToLowerInvariant();

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = canonicalTerraformType
        };

        if ((TryGetPropertyIgnoreCase(res, "provider_name", out JsonElement prov)
                || TryGetPropertyIgnoreCase(res, "providerName", out prov)
                || TryGetPropertyIgnoreCase(res, "provider", out prov))
            && prov.ValueKind == JsonValueKind.String)
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

        if (TryGetPropertyIgnoreCase(res, "tainted", out JsonElement tainted)
            && (tainted.ValueKind == JsonValueKind.True || tainted.ValueKind == JsonValueKind.False))
        {
            properties["tf.tainted"] = tainted.GetBoolean() ? "true" : "false";
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

            if ((TryGetPropertyIgnoreCase(res, "sensitive_values", out JsonElement sensitive) || TryGetPropertyIgnoreCase(res, "sensitiveValues", out sensitive)) && sensitive.ValueKind == JsonValueKind.Object)
                RedactTopLevelSensitiveTfValues(sensitive, properties);
        }

        if (TryGetPropertyIgnoreCase(res, "depends_on", out JsonElement depOn)
            || TryGetPropertyIgnoreCase(res, "dependsOn", out depOn))
        {
            List<string> refs = [];

            if (depOn.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement dep in depOn.EnumerateArray())
                {
                    if (dep.ValueKind != JsonValueKind.String)
                        continue;

                    string? r = dep.GetString();

                    if (!string.IsNullOrWhiteSpace(r))
                        refs.Add(r.Trim().ToLowerInvariant());
                }
            }
            else if (depOn.ValueKind == JsonValueKind.String)
            {
                string? r = depOn.GetString();

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
        string effectiveModuleAddress = ResolveResourceModuleAddress(res, moduleAddress);
        bool hasExplicitResourceAddress = TryGetResourceAddress(res, out string canonicalAddress);

        if (!hasExplicitResourceAddress)
        {
            canonicalAddress = BuildTerraformResourceAddress(
                effectiveModuleAddress,
                canonicalTerraformType,
                canonicalLabel);

            if (TryGetPropertyIgnoreCase(res, "index", out JsonElement indexElement))
            {
                if (indexElement.ValueKind == JsonValueKind.Number)
                {
                    if (indexElement.TryGetInt32(out int intIndex))
                        canonicalAddress = $"{canonicalAddress}[{intIndex}]";
                    else if (indexElement.TryGetInt64(out long longIndex))
                        canonicalAddress = $"{canonicalAddress}[{longIndex}]";
                }
                else if (indexElement.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(indexElement.GetString()))
                    canonicalAddress = $"{canonicalAddress}[{indexElement.GetString()!.Trim()}]";
            }
            else if ((TryGetPropertyIgnoreCase(res, "index_key", out JsonElement indexKeyElement)
                    || TryGetPropertyIgnoreCase(res, "indexKey", out indexKeyElement))
                && indexKeyElement.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(indexKeyElement.GetString()))
            {
                canonicalAddress = $"{canonicalAddress}[{indexKeyElement.GetString()!.Trim()}]";
            }
            else if ((TryGetPropertyIgnoreCase(res, "each", out JsonElement eachElement)
                    || TryGetPropertyIgnoreCase(res, "each_key", out eachElement)
                    || TryGetPropertyIgnoreCase(res, "eachKey", out eachElement))
                && eachElement.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(eachElement.GetString()))
            {
                canonicalAddress = $"{canonicalAddress}[{eachElement.GetString()!.Trim()}]";
            }
        }

        string resourceIdentity = BuildTerraformResourceIdentity(
            effectiveModuleAddress,
            canonicalTerraformType,
            canonicalLabel,
            canonicalAddress,
            hasExplicitResourceAddress);

        if (!hasExplicitResourceAddress)
        {
            string labelKey = BuildTerraformLabelKey(effectiveModuleAddress, canonicalTerraformType, canonicalLabel);

            if (labelTotals.TryGetValue(labelKey, out int total) && total > 1)
            {
                int occurrence = labelSeen.GetValueOrDefault(labelKey) + 1;
                labelSeen[labelKey] = occurrence;
                resourceIdentity = $"{resourceIdentity}|occurrence:{occurrence}";
                properties["terraformOccurrence"] = occurrence.ToString(CultureInfo.InvariantCulture);
            }
        }

        InfrastructureDeclarationSpecialPropertyMapper.Apply(properties, tfType, name);

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
