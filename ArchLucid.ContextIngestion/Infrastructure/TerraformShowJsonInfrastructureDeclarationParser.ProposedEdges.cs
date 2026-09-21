using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

public sealed partial class TerraformShowJsonInfrastructureDeclarationParser
{
    private static void TryEmitTerraformProposedEdges(
        JsonElement res,
        string moduleAddress,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results)
    {
        if (!TryGetPropertyIgnoreCase(res, "type", out JsonElement typeEl) || typeEl.ValueKind != JsonValueKind.String)
        {
            return;
        }

        string tfType = (typeEl.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(tfType))
        {
            return;
        }

        if (!TryGetPropertyIgnoreCase(res, "values", out JsonElement values) || values.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        string? fromLabel = TryResolveTerraformResourceLabel(res, out string label) ? label : null;
        string? fromArmId = TryGetResourceAddress(res, out string address) ? address : null;

        if (string.Equals(tfType, "azurerm_container_app", StringComparison.OrdinalIgnoreCase))
        {
            EmitContainerAppEnvProposals(values, declaration, results, fromLabel, fromArmId);

            return;
        }

        if (string.Equals(tfType, "azurerm_linux_web_app", StringComparison.OrdinalIgnoreCase))
        {
            EmitLinuxWebAppSettingProposals(values, declaration, results, fromLabel, fromArmId);
        }
    }

    private static void EmitContainerAppEnvProposals(
        JsonElement values,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        string? fromLabel,
        string? fromArmId)
    {
        if (!TryGetPropertyIgnoreCase(values, "template", out JsonElement template)
            || template.ValueKind != JsonValueKind.Array
            || template.GetArrayLength() == 0)
        {
            return;
        }

        JsonElement firstTemplate = template[0];

        if (!TryGetPropertyIgnoreCase(firstTemplate, "container", out JsonElement container)
            || container.ValueKind != JsonValueKind.Array
            || container.GetArrayLength() == 0)
        {
            return;
        }

        JsonElement firstContainer = container[0];

        if (!TryGetPropertyIgnoreCase(firstContainer, "env", out JsonElement env)
            || env.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement envEntry in env.EnumerateArray())
        {
            if (!TryGetPropertyIgnoreCase(envEntry, "name", out JsonElement nameEl)
                || nameEl.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string settingName = nameEl.GetString() ?? string.Empty;

            if (!TryGetPropertyIgnoreCase(envEntry, "value", out JsonElement valueEl)
                || valueEl.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? value = valueEl.GetString();

            if (string.Equals(value, "[REDACTED]", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                results,
                declaration,
                "terraform-show-json",
                settingName,
                value,
                fromLabel,
                fromArmId);
        }
    }

    private static void EmitLinuxWebAppSettingProposals(
        JsonElement values,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        string? fromLabel,
        string? fromArmId)
    {
        if (TryGetPropertyIgnoreCase(values, "app_settings", out JsonElement appSettings)
            && appSettings.ValueKind == JsonValueKind.Object)
        {
            foreach (JsonProperty setting in appSettings.EnumerateObject())
            {
                if (setting.Value.ValueKind != JsonValueKind.String)
                {
                    continue;
                }

                string? value = setting.Value.GetString();

                if (string.Equals(value, "[REDACTED]", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                    results,
                    declaration,
                    "terraform-show-json",
                    setting.Name,
                    value,
                    fromLabel,
                    fromArmId);
            }
        }

        if (!TryGetPropertyIgnoreCase(values, "connection_string", out JsonElement connectionStrings)
            || connectionStrings.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement connectionString in connectionStrings.EnumerateArray())
        {
            if (!TryGetPropertyIgnoreCase(connectionString, "name", out JsonElement nameEl)
                || nameEl.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            if (!TryGetPropertyIgnoreCase(connectionString, "value", out JsonElement valueEl)
                || valueEl.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? value = valueEl.GetString();

            if (string.Equals(value, "[REDACTED]", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                results,
                declaration,
                "terraform-show-json",
                nameEl.GetString() ?? string.Empty,
                value,
                fromLabel,
                fromArmId);
        }
    }
}
