using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Emits proposed hostname/catalog edges from redacted uploaded config string values (SN-RT-09).
/// </summary>
internal static class UploadedConfigProposedEdgeEmitter
{
    public const int MaxContentLength = 2_000_000;

    public static void EmitFromStringValue(
        List<CanonicalObject> results,
        InfrastructureDeclarationReference declaration,
        string sourceFileFormat,
        string settingName,
        string? value,
        string? fromLabel = null,
        string? fromArmId = null)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(declaration);

        if (UploadedConfigSettingKeyFilter.ShouldSkipKey(settingName)
            && !UploadedConfigSettingKeyFilter.ShouldParseValueForRejectedKey(value))
        {
            return;
        }

        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(value);

        if (parsed is null || !parsed.HasAnyField)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(parsed.Host) && string.IsNullOrWhiteSpace(parsed.KeyVaultHost))
        {
            return;
        }

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [OperatorInferredConnectionCanonicalPropertyKeys.ProvenanceKind] =
                ProvenanceKind.DeterministicInference.ToString(),
            [OperatorInferredConnectionCanonicalPropertyKeys.SourceFileFormat] = sourceFileFormat,
            [OperatorInferredConnectionCanonicalPropertyKeys.Source] =
                OperatorInferredConnectionSource.Upload.ToString(),
            [OperatorInferredConnectionCanonicalPropertyKeys.SettingName] = settingName,
        };

        if (!string.IsNullOrWhiteSpace(fromLabel))
        {
            properties[OperatorInferredConnectionCanonicalPropertyKeys.FromLabel] = fromLabel.Trim();
        }

        if (!string.IsNullOrWhiteSpace(fromArmId))
        {
            properties[OperatorInferredConnectionCanonicalPropertyKeys.FromArmId] = fromArmId.Trim();
        }

        if (!string.IsNullOrWhiteSpace(parsed.Host))
        {
            properties[OperatorInferredConnectionCanonicalPropertyKeys.ToHost] = parsed.Host.Trim().ToLowerInvariant();
        }
        else if (!string.IsNullOrWhiteSpace(parsed.KeyVaultHost))
        {
            properties[OperatorInferredConnectionCanonicalPropertyKeys.ToHost] = parsed.KeyVaultHost.Trim().ToLowerInvariant();
        }

        if (!string.IsNullOrWhiteSpace(parsed.Catalog))
        {
            properties[OperatorInferredConnectionCanonicalPropertyKeys.ToCatalog] = parsed.Catalog.Trim();
        }

        results.Add(new CanonicalObject
        {
            ObjectType = OperatorInferredConnectionCanonicalTypes.ProposalObjectType,
            Name = $"{settingName}:{properties.GetValueOrDefault(OperatorInferredConnectionCanonicalPropertyKeys.ToHost, "host")}",
            SourceType = OperatorInferredConnectionCanonicalTypes.ProposalSourceType,
            SourceId = declaration.DeclarationId ?? declaration.Name,
            Properties = properties,
        });
    }
}
