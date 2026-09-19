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

        if (TryGetPropertyIgnoreCase(res, "schema_version", out JsonElement schemaVersion)
            || TryGetPropertyIgnoreCase(res, "schemaVersion", out schemaVersion))
        {
            if (schemaVersion.ValueKind == JsonValueKind.Number)
                properties["tf.schema_version"] = schemaVersion.GetRawText();
            else if (schemaVersion.ValueKind == JsonValueKind.String)
            {
                string? schemaVersionText = schemaVersion.GetString();

                if (!string.IsNullOrWhiteSpace(schemaVersionText))
                    properties["tf.schema_version"] = schemaVersionText.Trim();
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "provider_config_key", out JsonElement providerConfigKey)
                || TryGetPropertyIgnoreCase(res, "providerConfigKey", out providerConfigKey))
            && providerConfigKey.ValueKind == JsonValueKind.String)
        {
            string? providerConfigKeyText = providerConfigKey.GetString();

            if (!string.IsNullOrWhiteSpace(providerConfigKeyText))
                properties["tf.provider_config_key"] = providerConfigKeyText.Trim().ToLowerInvariant();
        }

        if (TryGetPropertyIgnoreCase(res, "imported", out JsonElement imported)
            && (imported.ValueKind == JsonValueKind.True || imported.ValueKind == JsonValueKind.False))
        {
            properties["tf.imported"] = imported.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "create_before_destroy", out JsonElement createBeforeDestroy)
                || TryGetPropertyIgnoreCase(res, "createBeforeDestroy", out createBeforeDestroy))
            && (createBeforeDestroy.ValueKind == JsonValueKind.True || createBeforeDestroy.ValueKind == JsonValueKind.False))
        {
            properties["tf.create_before_destroy"] = createBeforeDestroy.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "prevent_destroy", out JsonElement preventDestroy)
                || TryGetPropertyIgnoreCase(res, "preventDestroy", out preventDestroy))
            && (preventDestroy.ValueKind == JsonValueKind.True || preventDestroy.ValueKind == JsonValueKind.False))
        {
            properties["tf.prevent_destroy"] = preventDestroy.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "deletion_protection", out JsonElement deletionProtection)
                || TryGetPropertyIgnoreCase(res, "deletionProtection", out deletionProtection))
            && (deletionProtection.ValueKind == JsonValueKind.True || deletionProtection.ValueKind == JsonValueKind.False))
        {
            properties["tf.deletion_protection"] = deletionProtection.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "timeout_create", out JsonElement timeoutCreate)
                || TryGetPropertyIgnoreCase(res, "timeoutCreate", out timeoutCreate))
            && timeoutCreate.ValueKind == JsonValueKind.String)
        {
            string? timeoutCreateText = timeoutCreate.GetString();

            if (!string.IsNullOrWhiteSpace(timeoutCreateText))
                properties["tf.timeout_create"] = timeoutCreateText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "timeout_delete", out JsonElement timeoutDelete)
                || TryGetPropertyIgnoreCase(res, "timeoutDelete", out timeoutDelete))
            && timeoutDelete.ValueKind == JsonValueKind.String)
        {
            string? timeoutDeleteText = timeoutDelete.GetString();

            if (!string.IsNullOrWhiteSpace(timeoutDeleteText))
                properties["tf.timeout_delete"] = timeoutDeleteText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "timeout_update", out JsonElement timeoutUpdate)
                || TryGetPropertyIgnoreCase(res, "timeoutUpdate", out timeoutUpdate))
            && timeoutUpdate.ValueKind == JsonValueKind.String)
        {
            string? timeoutUpdateText = timeoutUpdate.GetString();

            if (!string.IsNullOrWhiteSpace(timeoutUpdateText))
                properties["tf.timeout_update"] = timeoutUpdateText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "timeout_read", out JsonElement timeoutRead)
                || TryGetPropertyIgnoreCase(res, "timeoutRead", out timeoutRead))
            && timeoutRead.ValueKind == JsonValueKind.String)
        {
            string? timeoutReadText = timeoutRead.GetString();

            if (!string.IsNullOrWhiteSpace(timeoutReadText))
                properties["tf.timeout_read"] = timeoutReadText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "timeouts", out JsonElement timeouts)
            && timeouts.ValueKind == JsonValueKind.Object)
        {
            List<string> timeoutPairs = [];

            foreach (string key in new[] { "create", "delete", "read", "update" })
            {
                if (!TryGetPropertyIgnoreCase(timeouts, key, out JsonElement timeoutValue)
                    || timeoutValue.ValueKind != JsonValueKind.String)
                    continue;

                string? timeoutText = timeoutValue.GetString();

                if (!string.IsNullOrWhiteSpace(timeoutText))
                    timeoutPairs.Add($"{key}={timeoutText.Trim()}");
            }

            if (timeoutPairs.Count > 0)
            {
                string joined = string.Join('|', timeoutPairs);

                properties["tf.timeouts"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "generate_config", out JsonElement generateConfig)
                || TryGetPropertyIgnoreCase(res, "generateConfig", out generateConfig))
            && (generateConfig.ValueKind == JsonValueKind.True || generateConfig.ValueKind == JsonValueKind.False))
        {
            properties["tf.generate_config"] = generateConfig.GetBoolean() ? "true" : "false";
        }

        if (TryGetPropertyIgnoreCase(res, "refresh", out JsonElement refresh)
            && (refresh.ValueKind == JsonValueKind.True || refresh.ValueKind == JsonValueKind.False))
        {
            properties["tf.refresh"] = refresh.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "write_only", out JsonElement writeOnly)
                || TryGetPropertyIgnoreCase(res, "writeOnly", out writeOnly))
            && (writeOnly.ValueKind == JsonValueKind.True || writeOnly.ValueKind == JsonValueKind.False))
        {
            properties["tf.write_only"] = writeOnly.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "refresh_only", out JsonElement refreshOnly)
                || TryGetPropertyIgnoreCase(res, "refreshOnly", out refreshOnly))
            && (refreshOnly.ValueKind == JsonValueKind.True || refreshOnly.ValueKind == JsonValueKind.False))
        {
            properties["tf.refresh_only"] = refreshOnly.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "recreate", out JsonElement recreate)
                || TryGetPropertyIgnoreCase(res, "recreate", out recreate))
            && (recreate.ValueKind == JsonValueKind.True || recreate.ValueKind == JsonValueKind.False))
        {
            properties["tf.recreate"] = recreate.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "import_id", out JsonElement importId)
                || TryGetPropertyIgnoreCase(res, "importId", out importId))
            && importId.ValueKind == JsonValueKind.String)
        {
            string? importIdText = importId.GetString();

            if (!string.IsNullOrWhiteSpace(importIdText))
                properties["tf.import_id"] = importIdText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "retain", out JsonElement retain)
                || TryGetPropertyIgnoreCase(res, "retain", out retain))
            && (retain.ValueKind == JsonValueKind.True || retain.ValueKind == JsonValueKind.False))
        {
            properties["tf.retain"] = retain.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "allow_missing", out JsonElement allowMissing)
                || TryGetPropertyIgnoreCase(res, "allowMissing", out allowMissing))
            && (allowMissing.ValueKind == JsonValueKind.True || allowMissing.ValueKind == JsonValueKind.False))
        {
            properties["tf.allow_missing"] = allowMissing.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "destroy", out JsonElement destroy)
                || TryGetPropertyIgnoreCase(res, "destroy", out destroy))
            && (destroy.ValueKind == JsonValueKind.True || destroy.ValueKind == JsonValueKind.False))
        {
            properties["tf.destroy"] = destroy.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "upgrade", out JsonElement upgrade)
                || TryGetPropertyIgnoreCase(res, "upgrade", out upgrade))
            && (upgrade.ValueKind == JsonValueKind.True || upgrade.ValueKind == JsonValueKind.False))
        {
            properties["tf.upgrade"] = upgrade.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "ephemeral", out JsonElement ephemeral)
                || TryGetPropertyIgnoreCase(res, "ephemeral", out ephemeral))
            && (ephemeral.ValueKind == JsonValueKind.True || ephemeral.ValueKind == JsonValueKind.False))
        {
            properties["tf.ephemeral"] = ephemeral.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "replace", out JsonElement replace)
                || TryGetPropertyIgnoreCase(res, "replace", out replace))
            && (replace.ValueKind == JsonValueKind.True || replace.ValueKind == JsonValueKind.False))
        {
            properties["tf.replace"] = replace.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "disabled", out JsonElement disabled)
                || TryGetPropertyIgnoreCase(res, "disabled", out disabled))
            && (disabled.ValueKind == JsonValueKind.True || disabled.ValueKind == JsonValueKind.False))
        {
            properties["tf.disabled"] = disabled.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "locked", out JsonElement locked)
                || TryGetPropertyIgnoreCase(res, "locked", out locked))
            && (locked.ValueKind == JsonValueKind.True || locked.ValueKind == JsonValueKind.False))
        {
            properties["tf.locked"] = locked.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "source", out JsonElement source)
                || TryGetPropertyIgnoreCase(res, "source", out source))
            && source.ValueKind == JsonValueKind.String)
        {
            string? sourceText = source.GetString();

            if (!string.IsNullOrWhiteSpace(sourceText))
                properties["tf.source"] = sourceText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "hidden", out JsonElement hidden)
                || TryGetPropertyIgnoreCase(res, "hidden", out hidden))
            && (hidden.ValueKind == JsonValueKind.True || hidden.ValueKind == JsonValueKind.False))
        {
            properties["tf.hidden"] = hidden.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "waived", out JsonElement waived)
                || TryGetPropertyIgnoreCase(res, "waived", out waived))
            && (waived.ValueKind == JsonValueKind.True || waived.ValueKind == JsonValueKind.False))
        {
            properties["tf.waived"] = waived.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "version", out JsonElement version)
                || TryGetPropertyIgnoreCase(res, "version", out version))
            && version.ValueKind == JsonValueKind.String)
        {
            string? versionText = version.GetString();

            if (!string.IsNullOrWhiteSpace(versionText))
                properties["tf.version"] = versionText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "declared", out JsonElement declared)
                || TryGetPropertyIgnoreCase(res, "declared", out declared))
            && (declared.ValueKind == JsonValueKind.True || declared.ValueKind == JsonValueKind.False))
        {
            properties["tf.declared"] = declared.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "orphan", out JsonElement orphan)
                || TryGetPropertyIgnoreCase(res, "orphan", out orphan))
            && (orphan.ValueKind == JsonValueKind.True || orphan.ValueKind == JsonValueKind.False))
        {
            properties["tf.orphan"] = orphan.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "module", out JsonElement module)
                || TryGetPropertyIgnoreCase(res, "module", out module))
            && module.ValueKind == JsonValueKind.String)
        {
            string? moduleText = module.GetString();

            if (!string.IsNullOrWhiteSpace(moduleText))
                properties["tf.module"] = moduleText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "nested", out JsonElement nested)
                || TryGetPropertyIgnoreCase(res, "nested", out nested))
            && (nested.ValueKind == JsonValueKind.True || nested.ValueKind == JsonValueKind.False))
        {
            properties["tf.nested"] = nested.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "suspended", out JsonElement suspended)
                || TryGetPropertyIgnoreCase(res, "suspended", out suspended))
            && (suspended.ValueKind == JsonValueKind.True || suspended.ValueKind == JsonValueKind.False))
        {
            properties["tf.suspended"] = suspended.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "target", out JsonElement target)
                || TryGetPropertyIgnoreCase(res, "target", out target))
            && target.ValueKind == JsonValueKind.String)
        {
            string? targetText = target.GetString();

            if (!string.IsNullOrWhiteSpace(targetText))
                properties["tf.target"] = targetText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "checkpoint", out JsonElement checkpoint)
                || TryGetPropertyIgnoreCase(res, "checkpoint", out checkpoint))
            && (checkpoint.ValueKind == JsonValueKind.True || checkpoint.ValueKind == JsonValueKind.False))
        {
            properties["tf.checkpoint"] = checkpoint.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "revoked", out JsonElement revoked)
                || TryGetPropertyIgnoreCase(res, "revoked", out revoked))
            && (revoked.ValueKind == JsonValueKind.True || revoked.ValueKind == JsonValueKind.False))
        {
            properties["tf.revoked"] = revoked.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "schema", out JsonElement schema)
                || TryGetPropertyIgnoreCase(res, "schema", out schema))
            && schema.ValueKind == JsonValueKind.String)
        {
            string? schemaText = schema.GetString();

            if (!string.IsNullOrWhiteSpace(schemaText))
                properties["tf.schema"] = schemaText.Trim();
        }

        if ((TryGetPropertyIgnoreCase(res, "annotated", out JsonElement annotated)
                || TryGetPropertyIgnoreCase(res, "annotated", out annotated))
            && (annotated.ValueKind == JsonValueKind.True || annotated.ValueKind == JsonValueKind.False))
        {
            properties["tf.annotated"] = annotated.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "secured", out JsonElement secured)
                || TryGetPropertyIgnoreCase(res, "secured", out secured))
            && (secured.ValueKind == JsonValueKind.True || secured.ValueKind == JsonValueKind.False))
        {
            properties["tf.secured"] = secured.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "label", out JsonElement label)
                || TryGetPropertyIgnoreCase(res, "label", out label))
            && label.ValueKind == JsonValueKind.String)
        {
            string? labelText = label.GetString();

            if (!string.IsNullOrWhiteSpace(labelText))
                properties["tf.label"] = labelText.Trim();
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
                properties["tf.depends_on"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "replace_triggered_by", out JsonElement replaceTriggered)
            || TryGetPropertyIgnoreCase(res, "replaceTriggeredBy", out replaceTriggered))
        {
            List<string> replaceRefs = [];

            if (replaceTriggered.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement dep in replaceTriggered.EnumerateArray())
                {
                    if (dep.ValueKind != JsonValueKind.String)
                        continue;

                    string? r = dep.GetString();

                    if (!string.IsNullOrWhiteSpace(r))
                        replaceRefs.Add(r.Trim().ToLowerInvariant());
                }
            }
            else if (replaceTriggered.ValueKind == JsonValueKind.String)
            {
                string? r = replaceTriggered.GetString();

                if (!string.IsNullOrWhiteSpace(r))
                    replaceRefs.Add(r.Trim().ToLowerInvariant());
            }

            if (replaceRefs.Count > 0)
            {
                string joined = string.Join('|', replaceRefs.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.replace_triggered_by"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "ignore_changes", out JsonElement ignoreChanges)
            || TryGetPropertyIgnoreCase(res, "ignoreChanges", out ignoreChanges))
        {
            List<string> ignoredFields = [];

            if (ignoreChanges.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in ignoreChanges.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        ignoredFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (ignoreChanges.ValueKind == JsonValueKind.String)
            {
                string? value = ignoreChanges.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    ignoredFields.Add(value.Trim().ToLowerInvariant());
            }

            if (ignoredFields.Count > 0)
            {
                string joined = string.Join('|', ignoredFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.ignore_changes"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "precondition", out JsonElement precondition)
            || TryGetPropertyIgnoreCase(res, "preconditions", out precondition))
        {
            List<string> preconditionFields = [];

            if (precondition.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in precondition.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        preconditionFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (precondition.ValueKind == JsonValueKind.String)
            {
                string? value = precondition.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    preconditionFields.Add(value.Trim().ToLowerInvariant());
            }

            if (preconditionFields.Count > 0)
            {
                string joined = string.Join('|', preconditionFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.precondition"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "postcondition", out JsonElement postcondition)
            || TryGetPropertyIgnoreCase(res, "postconditions", out postcondition))
        {
            List<string> postconditionFields = [];

            if (postcondition.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in postcondition.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        postconditionFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (postcondition.ValueKind == JsonValueKind.String)
            {
                string? value = postcondition.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    postconditionFields.Add(value.Trim().ToLowerInvariant());
            }

            if (postconditionFields.Count > 0)
            {
                string joined = string.Join('|', postconditionFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.postcondition"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "removed", out JsonElement removedEl)
            || TryGetPropertyIgnoreCase(res, "removed", out removedEl))
        {
            List<string> removedFields = [];

            if (removedEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in removedEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        removedFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (removedEl.ValueKind == JsonValueKind.String)
            {
                string? value = removedEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    removedFields.Add(value.Trim().ToLowerInvariant());
            }

            if (removedFields.Count > 0)
            {
                string joined = string.Join('|', removedFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.removed"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "moved", out JsonElement movedEl)
            || TryGetPropertyIgnoreCase(res, "moved", out movedEl))
        {
            List<string> movedFields = [];

            if (movedEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in movedEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        movedFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (movedEl.ValueKind == JsonValueKind.String)
            {
                string? value = movedEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    movedFields.Add(value.Trim().ToLowerInvariant());
            }

            if (movedFields.Count > 0)
            {
                string joined = string.Join('|', movedFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.moved"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "triggers", out JsonElement triggersEl)
            || TryGetPropertyIgnoreCase(res, "triggers", out triggersEl))
        {
            List<string> triggersFields = [];

            if (triggersEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in triggersEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        triggersFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (triggersEl.ValueKind == JsonValueKind.String)
            {
                string? value = triggersEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    triggersFields.Add(value.Trim().ToLowerInvariant());
            }

            if (triggersFields.Count > 0)
            {
                string joined = string.Join('|', triggersFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.triggers"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "conflicts_with", out JsonElement conflictswithEl)
            || TryGetPropertyIgnoreCase(res, "conflictsWith", out conflictswithEl))
        {
            List<string> conflictswithFields = [];

            if (conflictswithEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in conflictswithEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        conflictswithFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (conflictswithEl.ValueKind == JsonValueKind.String)
            {
                string? value = conflictswithEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    conflictswithFields.Add(value.Trim().ToLowerInvariant());
            }

            if (conflictswithFields.Count > 0)
            {
                string joined = string.Join('|', conflictswithFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.conflicts_with"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "replace_on_changes", out JsonElement replaceonchangesEl)
            || TryGetPropertyIgnoreCase(res, "replaceOnChanges", out replaceonchangesEl))
        {
            List<string> replaceonchangesFields = [];

            if (replaceonchangesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in replaceonchangesEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        replaceonchangesFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (replaceonchangesEl.ValueKind == JsonValueKind.String)
            {
                string? value = replaceonchangesEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    replaceonchangesFields.Add(value.Trim().ToLowerInvariant());
            }

            if (replaceonchangesFields.Count > 0)
            {
                string joined = string.Join('|', replaceonchangesFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.replace_on_changes"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "aliases", out JsonElement aliasesEl)
            || TryGetPropertyIgnoreCase(res, "aliases", out aliasesEl))
        {
            List<string> aliasesFields = [];

            if (aliasesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in aliasesEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        aliasesFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (aliasesEl.ValueKind == JsonValueKind.String)
            {
                string? value = aliasesEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    aliasesFields.Add(value.Trim().ToLowerInvariant());
            }

            if (aliasesFields.Count > 0)
            {
                string joined = string.Join('|', aliasesFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.aliases"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "parents", out JsonElement parentsEl)
            || TryGetPropertyIgnoreCase(res, "parents", out parentsEl))
        {
            List<string> parentsFields = [];

            if (parentsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in parentsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        parentsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (parentsEl.ValueKind == JsonValueKind.String)
            {
                string? value = parentsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    parentsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (parentsFields.Count > 0)
            {
                string joined = string.Join('|', parentsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.parents"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "overrides", out JsonElement overridesEl)
            || TryGetPropertyIgnoreCase(res, "overrides", out overridesEl))
        {
            List<string> overridesFields = [];

            if (overridesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in overridesEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        overridesFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (overridesEl.ValueKind == JsonValueKind.String)
            {
                string? value = overridesEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    overridesFields.Add(value.Trim().ToLowerInvariant());
            }

            if (overridesFields.Count > 0)
            {
                string joined = string.Join('|', overridesFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.overrides"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "members", out JsonElement membersEl)
            || TryGetPropertyIgnoreCase(res, "members", out membersEl))
        {
            List<string> membersFields = [];

            if (membersEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in membersEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        membersFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (membersEl.ValueKind == JsonValueKind.String)
            {
                string? value = membersEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    membersFields.Add(value.Trim().ToLowerInvariant());
            }

            if (membersFields.Count > 0)
            {
                string joined = string.Join('|', membersFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.members"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "children", out JsonElement childrenEl)
            || TryGetPropertyIgnoreCase(res, "children", out childrenEl))
        {
            List<string> childrenFields = [];

            if (childrenEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in childrenEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        childrenFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (childrenEl.ValueKind == JsonValueKind.String)
            {
                string? value = childrenEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    childrenFields.Add(value.Trim().ToLowerInvariant());
            }

            if (childrenFields.Count > 0)
            {
                string joined = string.Join('|', childrenFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.children"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if (TryGetPropertyIgnoreCase(res, "siblings", out JsonElement siblingsEl)
            || TryGetPropertyIgnoreCase(res, "siblings", out siblingsEl))
        {
            List<string> siblingsFields = [];

            if (siblingsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in siblingsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        siblingsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (siblingsEl.ValueKind == JsonValueKind.String)
            {
                string? value = siblingsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    siblingsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (siblingsFields.Count > 0)
            {
                string joined = string.Join('|', siblingsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.siblings"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "archived", out JsonElement archived)
                || TryGetPropertyIgnoreCase(res, "archived", out archived))
            && (archived.ValueKind == JsonValueKind.True || archived.ValueKind == JsonValueKind.False))
        {
            properties["tf.archived"] = archived.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "verified", out JsonElement verified)
                || TryGetPropertyIgnoreCase(res, "verified", out verified))
            && (verified.ValueKind == JsonValueKind.True || verified.ValueKind == JsonValueKind.False))
        {
            properties["tf.verified"] = verified.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "owner", out JsonElement owner)
                || TryGetPropertyIgnoreCase(res, "owner", out owner))
            && owner.ValueKind == JsonValueKind.String)
        {
            string? ownerText = owner.GetString();

            if (!string.IsNullOrWhiteSpace(ownerText))
                properties["tf.owner"] = ownerText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "ancestors", out JsonElement ancestorsEl)
            || TryGetPropertyIgnoreCase(res, "ancestors", out ancestorsEl))
        {
            List<string> ancestorsFields = [];

            if (ancestorsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in ancestorsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        ancestorsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (ancestorsEl.ValueKind == JsonValueKind.String)
            {
                string? value = ancestorsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    ancestorsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (ancestorsFields.Count > 0)
            {
                string joined = string.Join('|', ancestorsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.ancestors"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "pending", out JsonElement pending)
                || TryGetPropertyIgnoreCase(res, "pending", out pending))
            && (pending.ValueKind == JsonValueKind.True || pending.ValueKind == JsonValueKind.False))
        {
            properties["tf.pending"] = pending.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "visible", out JsonElement visible)
                || TryGetPropertyIgnoreCase(res, "visible", out visible))
            && (visible.ValueKind == JsonValueKind.True || visible.ValueKind == JsonValueKind.False))
        {
            properties["tf.visible"] = visible.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "description", out JsonElement description)
                || TryGetPropertyIgnoreCase(res, "description", out description))
            && description.ValueKind == JsonValueKind.String)
        {
            string? descriptionText = description.GetString();

            if (!string.IsNullOrWhiteSpace(descriptionText))
                properties["tf.description"] = descriptionText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "descendants", out JsonElement descendantsEl)
            || TryGetPropertyIgnoreCase(res, "descendants", out descendantsEl))
        {
            List<string> descendantsFields = [];

            if (descendantsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in descendantsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        descendantsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (descendantsEl.ValueKind == JsonValueKind.String)
            {
                string? value = descendantsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    descendantsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (descendantsFields.Count > 0)
            {
                string joined = string.Join('|', descendantsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.descendants"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "active", out JsonElement active)
                || TryGetPropertyIgnoreCase(res, "active", out active))
            && (active.ValueKind == JsonValueKind.True || active.ValueKind == JsonValueKind.False))
        {
            properties["tf.active"] = active.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "managed", out JsonElement managed)
                || TryGetPropertyIgnoreCase(res, "managed", out managed))
            && (managed.ValueKind == JsonValueKind.True || managed.ValueKind == JsonValueKind.False))
        {
            properties["tf.managed"] = managed.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "role", out JsonElement role)
                || TryGetPropertyIgnoreCase(res, "role", out role))
            && role.ValueKind == JsonValueKind.String)
        {
            string? roleText = role.GetString();

            if (!string.IsNullOrWhiteSpace(roleText))
                properties["tf.role"] = roleText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "peers", out JsonElement peersEl)
            || TryGetPropertyIgnoreCase(res, "peers", out peersEl))
        {
            List<string> peersFields = [];

            if (peersEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in peersEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        peersFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (peersEl.ValueKind == JsonValueKind.String)
            {
                string? value = peersEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    peersFields.Add(value.Trim().ToLowerInvariant());
            }

            if (peersFields.Count > 0)
            {
                string joined = string.Join('|', peersFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.peers"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "enabled", out JsonElement enabled)
                || TryGetPropertyIgnoreCase(res, "enabled", out enabled))
            && (enabled.ValueKind == JsonValueKind.True || enabled.ValueKind == JsonValueKind.False))
        {
            properties["tf.enabled"] = enabled.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "exposed", out JsonElement exposed)
                || TryGetPropertyIgnoreCase(res, "exposed", out exposed))
            && (exposed.ValueKind == JsonValueKind.True || exposed.ValueKind == JsonValueKind.False))
        {
            properties["tf.exposed"] = exposed.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "comment", out JsonElement comment)
                || TryGetPropertyIgnoreCase(res, "comment", out comment))
            && comment.ValueKind == JsonValueKind.String)
        {
            string? commentText = comment.GetString();

            if (!string.IsNullOrWhiteSpace(commentText))
                properties["tf.comment"] = commentText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "references", out JsonElement referencesEl)
            || TryGetPropertyIgnoreCase(res, "references", out referencesEl))
        {
            List<string> referencesFields = [];

            if (referencesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in referencesEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        referencesFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (referencesEl.ValueKind == JsonValueKind.String)
            {
                string? value = referencesEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    referencesFields.Add(value.Trim().ToLowerInvariant());
            }

            if (referencesFields.Count > 0)
            {
                string joined = string.Join('|', referencesFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.references"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "tracked", out JsonElement tracked)
                || TryGetPropertyIgnoreCase(res, "tracked", out tracked))
            && (tracked.ValueKind == JsonValueKind.True || tracked.ValueKind == JsonValueKind.False))
        {
            properties["tf.tracked"] = tracked.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "published", out JsonElement published)
                || TryGetPropertyIgnoreCase(res, "published", out published))
            && (published.ValueKind == JsonValueKind.True || published.ValueKind == JsonValueKind.False))
        {
            properties["tf.published"] = published.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "caption", out JsonElement caption)
                || TryGetPropertyIgnoreCase(res, "caption", out caption))
            && caption.ValueKind == JsonValueKind.String)
        {
            string? captionText = caption.GetString();

            if (!string.IsNullOrWhiteSpace(captionText))
                properties["tf.caption"] = captionText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "dependents", out JsonElement dependentsEl)
            || TryGetPropertyIgnoreCase(res, "dependents", out dependentsEl))
        {
            List<string> dependentsFields = [];

            if (dependentsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in dependentsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        dependentsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (dependentsEl.ValueKind == JsonValueKind.String)
            {
                string? value = dependentsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    dependentsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (dependentsFields.Count > 0)
            {
                string joined = string.Join('|', dependentsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.dependents"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "approved", out JsonElement approved)
                || TryGetPropertyIgnoreCase(res, "approved", out approved))
            && (approved.ValueKind == JsonValueKind.True || approved.ValueKind == JsonValueKind.False))
        {
            properties["tf.approved"] = approved.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "deprecated", out JsonElement deprecated)
                || TryGetPropertyIgnoreCase(res, "deprecated", out deprecated))
            && (deprecated.ValueKind == JsonValueKind.True || deprecated.ValueKind == JsonValueKind.False))
        {
            properties["tf.deprecated"] = deprecated.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "purpose", out JsonElement purpose)
                || TryGetPropertyIgnoreCase(res, "purpose", out purpose))
            && purpose.ValueKind == JsonValueKind.String)
        {
            string? purposeText = purpose.GetString();

            if (!string.IsNullOrWhiteSpace(purposeText))
                properties["tf.purpose"] = purposeText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "bindings", out JsonElement bindingsEl)
            || TryGetPropertyIgnoreCase(res, "bindings", out bindingsEl))
        {
            List<string> bindingsFields = [];

            if (bindingsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in bindingsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        bindingsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (bindingsEl.ValueKind == JsonValueKind.String)
            {
                string? value = bindingsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    bindingsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (bindingsFields.Count > 0)
            {
                string joined = string.Join('|', bindingsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.bindings"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "finalized", out JsonElement finalized)
                || TryGetPropertyIgnoreCase(res, "finalized", out finalized))
            && (finalized.ValueKind == JsonValueKind.True || finalized.ValueKind == JsonValueKind.False))
        {
            properties["tf.finalized"] = finalized.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "reviewed", out JsonElement reviewed)
                || TryGetPropertyIgnoreCase(res, "reviewed", out reviewed))
            && (reviewed.ValueKind == JsonValueKind.True || reviewed.ValueKind == JsonValueKind.False))
        {
            properties["tf.reviewed"] = reviewed.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "summary", out JsonElement summary)
                || TryGetPropertyIgnoreCase(res, "summary", out summary))
            && summary.ValueKind == JsonValueKind.String)
        {
            string? summaryText = summary.GetString();

            if (!string.IsNullOrWhiteSpace(summaryText))
                properties["tf.summary"] = summaryText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "providers", out JsonElement providersEl)
            || TryGetPropertyIgnoreCase(res, "providers", out providersEl))
        {
            List<string> providersFields = [];

            if (providersEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in providersEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        providersFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (providersEl.ValueKind == JsonValueKind.String)
            {
                string? value = providersEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    providersFields.Add(value.Trim().ToLowerInvariant());
            }

            if (providersFields.Count > 0)
            {
                string joined = string.Join('|', providersFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.providers"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "accepted", out JsonElement accepted)
                || TryGetPropertyIgnoreCase(res, "accepted", out accepted))
            && (accepted.ValueKind == JsonValueKind.True || accepted.ValueKind == JsonValueKind.False))
        {
            properties["tf.accepted"] = accepted.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "rejected", out JsonElement rejected)
                || TryGetPropertyIgnoreCase(res, "rejected", out rejected))
            && (rejected.ValueKind == JsonValueKind.True || rejected.ValueKind == JsonValueKind.False))
        {
            properties["tf.rejected"] = rejected.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "intent", out JsonElement intent)
                || TryGetPropertyIgnoreCase(res, "intent", out intent))
            && intent.ValueKind == JsonValueKind.String)
        {
            string? intentText = intent.GetString();

            if (!string.IsNullOrWhiteSpace(intentText))
                properties["tf.intent"] = intentText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "endpoints", out JsonElement endpointsEl)
            || TryGetPropertyIgnoreCase(res, "endpoints", out endpointsEl))
        {
            List<string> endpointsFields = [];

            if (endpointsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in endpointsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        endpointsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (endpointsEl.ValueKind == JsonValueKind.String)
            {
                string? value = endpointsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    endpointsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (endpointsFields.Count > 0)
            {
                string joined = string.Join('|', endpointsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.endpoints"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "validated", out JsonElement validated)
                || TryGetPropertyIgnoreCase(res, "validated", out validated))
            && (validated.ValueKind == JsonValueKind.True || validated.ValueKind == JsonValueKind.False))
        {
            properties["tf.validated"] = validated.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "canceled", out JsonElement canceled)
                || TryGetPropertyIgnoreCase(res, "canceled", out canceled))
            && (canceled.ValueKind == JsonValueKind.True || canceled.ValueKind == JsonValueKind.False))
        {
            properties["tf.canceled"] = canceled.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "notes", out JsonElement notes)
                || TryGetPropertyIgnoreCase(res, "notes", out notes))
            && notes.ValueKind == JsonValueKind.String)
        {
            string? notesText = notes.GetString();

            if (!string.IsNullOrWhiteSpace(notesText))
                properties["tf.notes"] = notesText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "subnets", out JsonElement subnetsEl)
            || TryGetPropertyIgnoreCase(res, "subnets", out subnetsEl))
        {
            List<string> subnetsFields = [];

            if (subnetsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in subnetsEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        subnetsFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (subnetsEl.ValueKind == JsonValueKind.String)
            {
                string? value = subnetsEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    subnetsFields.Add(value.Trim().ToLowerInvariant());
            }

            if (subnetsFields.Count > 0)
            {
                string joined = string.Join('|', subnetsFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.subnets"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "completed", out JsonElement completed)
                || TryGetPropertyIgnoreCase(res, "completed", out completed))
            && (completed.ValueKind == JsonValueKind.True || completed.ValueKind == JsonValueKind.False))
        {
            properties["tf.completed"] = completed.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "deleted", out JsonElement deleted)
                || TryGetPropertyIgnoreCase(res, "deleted", out deleted))
            && (deleted.ValueKind == JsonValueKind.True || deleted.ValueKind == JsonValueKind.False))
        {
            properties["tf.deleted"] = deleted.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "title", out JsonElement title)
                || TryGetPropertyIgnoreCase(res, "title", out title))
            && title.ValueKind == JsonValueKind.String)
        {
            string? titleText = title.GetString();

            if (!string.IsNullOrWhiteSpace(titleText))
                properties["tf.title"] = titleText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "gateways", out JsonElement gatewaysEl)
            || TryGetPropertyIgnoreCase(res, "gateways", out gatewaysEl))
        {
            List<string> gatewaysFields = [];

            if (gatewaysEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in gatewaysEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        gatewaysFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (gatewaysEl.ValueKind == JsonValueKind.String)
            {
                string? value = gatewaysEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    gatewaysFields.Add(value.Trim().ToLowerInvariant());
            }

            if (gatewaysFields.Count > 0)
            {
                string joined = string.Join('|', gatewaysFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.gateways"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }

        if ((TryGetPropertyIgnoreCase(res, "scheduled", out JsonElement scheduled)
                || TryGetPropertyIgnoreCase(res, "scheduled", out scheduled))
            && (scheduled.ValueKind == JsonValueKind.True || scheduled.ValueKind == JsonValueKind.False))
        {
            properties["tf.scheduled"] = scheduled.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "expired", out JsonElement expired)
                || TryGetPropertyIgnoreCase(res, "expired", out expired))
            && (expired.ValueKind == JsonValueKind.True || expired.ValueKind == JsonValueKind.False))
        {
            properties["tf.expired"] = expired.GetBoolean() ? "true" : "false";
        }

        if ((TryGetPropertyIgnoreCase(res, "reason", out JsonElement reason)
                || TryGetPropertyIgnoreCase(res, "reason", out reason))
            && reason.ValueKind == JsonValueKind.String)
        {
            string? reasonText = reason.GetString();

            if (!string.IsNullOrWhiteSpace(reasonText))
                properties["tf.reason"] = reasonText.Trim();
        }

        if (TryGetPropertyIgnoreCase(res, "routes", out JsonElement routesEl)
            || TryGetPropertyIgnoreCase(res, "routes", out routesEl))
        {
            List<string> routesFields = [];

            if (routesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in routesEl.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        routesFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (routesEl.ValueKind == JsonValueKind.String)
            {
                string? value = routesEl.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    routesFields.Add(value.Trim().ToLowerInvariant());
            }

            if (routesFields.Count > 0)
            {
                string joined = string.Join('|', routesFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.routes"] = joined.Length > 2000 ? joined[..2000] : joined;
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

            if (TryGetPropertyIgnoreCase(res, "index", out JsonElement indexElement)
                || TryGetPropertyIgnoreCase(res, "count", out indexElement))
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
                    || TryGetPropertyIgnoreCase(res, "eachKey", out eachElement)
                    || TryGetPropertyIgnoreCase(res, "each_value", out eachElement)
                    || TryGetPropertyIgnoreCase(res, "eachValue", out eachElement)
                    || TryGetPropertyIgnoreCase(res, "for_each", out eachElement))
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
