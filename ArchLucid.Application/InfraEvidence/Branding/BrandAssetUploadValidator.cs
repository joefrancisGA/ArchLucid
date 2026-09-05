using System.Text;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.InfraEvidence.Branding;

public static partial class BrandAssetUploadValidator
{
    public const int MaxAssetBytes = 2 * 1024 * 1024;

    public static BrandAssetValidationResult Validate(byte[] assetBytes, string? fileName)
    {
        ArgumentNullException.ThrowIfNull(assetBytes);

        if (assetBytes.Length == 0)
            return BrandAssetValidationResult.Fail("Asset payload is empty.");

        if (assetBytes.Length > MaxAssetBytes)
            return BrandAssetValidationResult.Fail($"Asset exceeds maximum size of {MaxAssetBytes} bytes.");

        if (IsPng(assetBytes))
            return BrandAssetValidationResult.Ok("image/png", ".png");

        if (IsJpeg(assetBytes))
            return BrandAssetValidationResult.Ok("image/jpeg", ".jpg");

        if (LooksLikeSvg(assetBytes, fileName))
        {
            string? svgError = ValidateSvgSafety(assetBytes);

            if (svgError is not null)
                return BrandAssetValidationResult.Fail(svgError);

            return BrandAssetValidationResult.Ok("image/svg+xml", ".svg");
        }

        return BrandAssetValidationResult.Fail("Asset must be SVG, PNG, or JPEG (validated via magic bytes or .svg extension).");
    }

    private static bool LooksLikeSvg(byte[] assetBytes, string? fileName)
    {
        if (!string.IsNullOrWhiteSpace(fileName)
            && fileName.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string prefix = Encoding.UTF8.GetString(assetBytes, 0, Math.Min(assetBytes.Length, 256));
        return prefix.Contains("<svg", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ValidateSvgSafety(byte[] assetBytes)
    {
        string content = Encoding.UTF8.GetString(assetBytes);

        if (ScriptTagRegex().IsMatch(content))
            return "SVG assets cannot contain script elements.";

        if (ForeignObjectRegex().IsMatch(content))
            return "SVG assets cannot contain foreignObject elements.";

        if (EventHandlerAttributeRegex().IsMatch(content))
            return "SVG assets cannot contain event handler attributes.";

        if (JavascriptUrlRegex().IsMatch(content))
            return "SVG assets cannot contain javascript: URLs.";

        if (ExternalUseHrefRegex().IsMatch(content))
            return "SVG assets cannot reference external href/use targets.";

        return null;
    }

    private static bool IsPng(byte[] bytes) =>
        bytes.Length >= 8
        && bytes[0] == 0x89
        && bytes[1] == 0x50
        && bytes[2] == 0x4E
        && bytes[3] == 0x47;

    private static bool IsJpeg(byte[] bytes) =>
        bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;

    [GeneratedRegex(@"<script\b", RegexOptions.IgnoreCase)]
    private static partial Regex ScriptTagRegex();

    [GeneratedRegex(@"<foreignObject\b", RegexOptions.IgnoreCase)]
    private static partial Regex ForeignObjectRegex();

    [GeneratedRegex(@"\son[a-z]+\s*=", RegexOptions.IgnoreCase)]
    private static partial Regex EventHandlerAttributeRegex();

    [GeneratedRegex(@"javascript\s*:", RegexOptions.IgnoreCase)]
    private static partial Regex JavascriptUrlRegex();

    [GeneratedRegex(@"(xlink:href|href)\s*=\s*""https?://", RegexOptions.IgnoreCase)]
    private static partial Regex ExternalUseHrefRegex();
}

public sealed class BrandAssetValidationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public string MimeType
    {
        get;
        init;
    } = string.Empty;

    public string FileExtension
    {
        get;
        init;
    } = string.Empty;

    public static BrandAssetValidationResult Ok(string mimeType, string fileExtension) =>
        new() { Succeeded = true, MimeType = mimeType, FileExtension = fileExtension };

    public static BrandAssetValidationResult Fail(string message) =>
        new() { Succeeded = false, ErrorMessage = message };
}
