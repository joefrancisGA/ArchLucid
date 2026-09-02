using System.Globalization;
using System.IO.Compression;
using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Loads <c>resources.json</c> from extractor ZIP payloads created by Get-ArchLucidAzurePackage.ps1.</summary>
public static class AzureExtractorResourceInventoryReader
{
    private const string ResourcesEntryName = "resources.json";

    private static readonly JsonSerializerOptions SerializerOptions =
        new() { PropertyNameCaseInsensitive = true };

    /// <returns>Parsed ARM rows plus error detail when unreadable.</returns>
    public static (IReadOnlyList<AzureExtractorInventoryResourceLine>? Lines, string? Error) TryReadFromZip(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try

        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            ZipArchiveEntry? entry =
                archive.GetEntry(ResourcesEntryName)
                ?? archive.Entries.FirstOrDefault(static e => ResourcesEntryName.Equals(e.Name, StringComparison.OrdinalIgnoreCase));

            if (entry is null)
                return ([], null); // Older packages may omit it; callers treat empty as harmless.

            using Stream rs = entry.Open();
            JsonDocument json = JsonDocument.Parse(rs);

            if (json.RootElement.ValueKind is not JsonValueKind.Array)

                return (null, "resources.json root must be a JSON array.");

            List<AzureExtractorInventoryResourceLine> lines = [];

            foreach (JsonElement row in json.RootElement.EnumerateArray())
            {

                if (row.ValueKind is not JsonValueKind.Object)

                    continue;

                if (!TryReadString(row, "name", out string name) &&
                    !TryReadString(row, "Name", out name))

                    continue;

                if (!TryReadString(row, "resourceType", out string rt) &&
                    !TryReadString(row, "ResourceType", out rt))

                    continue;

                string? loc = TryReadNullableString(row, "location")

                    ?? TryReadNullableString(row, "Location");

                string? skuName = ExtractSku(row);

                lines.Add(new AzureExtractorInventoryResourceLine(name.Trim(), rt.Trim(),
                    string.IsNullOrWhiteSpace(loc) ? null : loc.Trim(), skuName));
            }

            return (lines, null);
        }

        catch (JsonException)

        {
            return (null, "resources.json JSON is malformed.");
        }

        catch (InvalidDataException)

        {
            return (null, "ZIP payload is invalid while reading resources.json.");
        }
    }

    private static string? TryReadNullableString(JsonElement obj, string property)
    {
        if (!obj.TryGetProperty(property, out JsonElement p))
            return null;

        if (!TryReadStringToken(p, out string? raw))
            return null;

        return string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();
    }

    private static bool TryReadString(JsonElement obj, string property, out string value)
    {
        value = string.Empty;

        if (!obj.TryGetProperty(property, out JsonElement p))
            return false;

        if (!TryReadStringToken(p, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return false;

        value = raw;

        return true;
    }

    private static bool TryReadStringToken(JsonElement element, out string? value)
    {
        if (element.ValueKind is JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (TryNormalizeBooleanString(raw, out string? normalized))
            {
                value = normalized;

                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberLongString(raw.Trim(), out long numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return true;
            }

            value = raw;

            return true;
        }

        if (element.ValueKind is JsonValueKind.Number)
        {
            value = TryReadWholeNumberLongToken(element);

            return value is not null;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return true;
        }

        value = null;

        return false;
    }

    private static string? TryReadWholeNumberLongToken(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Number)
        {
            return null;
        }

        if (element.TryGetInt64(out long numeric))
        {
            return numeric.ToString(CultureInfo.InvariantCulture);
        }

        if (element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
        {
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);
        }

        return element.GetRawText();
    }

    private static string? ExtractSku(JsonElement row)
    {
        if (!row.TryGetProperty("sku", out JsonElement sku) && !row.TryGetProperty("Sku", out sku))
            return null;

        if (TryReadStringToken(sku, out string? skuText))
        {
            return skuText?.Trim();
        }

        if (sku.ValueKind is JsonValueKind.Object && sku.TryGetProperty("name", out JsonElement skuNameProp)
            && TryReadStringToken(skuNameProp, out string? skuName))
        {
            return skuName?.Trim();
        }

        if (sku.ValueKind is JsonValueKind.Object && sku.TryGetProperty("Name", out JsonElement skuNameCapital)
            && TryReadStringToken(skuNameCapital, out string? skuNamePascal))
        {
            return skuNamePascal?.Trim();
        }

        return null;
    }

    private static bool TryNormalizeBooleanString(string? raw, out string? value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = null;

            return false;
        }

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            value = "true";

            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            value = "false";

            return true;
        }

        value = null;

        return false;
    }

    private static bool TryParseWholeNumberLongString(string? raw, out long value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (long.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (long)numeric;

            return true;
        }

        value = default;

        return false;
    }
}
