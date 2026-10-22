namespace ArchLucid.Application.Evidence;

/// <summary>Fail-closed rules for inline preview vs attachment-only delivery (ESI-02/04).</summary>
public static class StoredEvidenceFileContentSafety
{
    public static bool MustForceAttachmentDisposition(string? contentType, string? fileName)
    {
        if (IsUnsafeInlineContentType(contentType))
        {
            return true;
        }

        string extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();

        return extension is ".html" or ".htm" or ".svg" or ".xhtml";
    }

    public static bool IsPreviewableContentType(string? contentType, string? fileName)
    {
        if (MustForceAttachmentDisposition(contentType, fileName))
        {
            return false;
        }

        string normalized = (contentType ?? string.Empty).Trim().ToLowerInvariant();
        string extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();

        if (normalized.StartsWith("image/", StringComparison.Ordinal))
        {
            return normalized is "image/png" or "image/jpeg" or "image/jpg" or "image/gif" or "image/webp";
        }

        if (normalized is "text/plain" or "text/markdown" or "application/json" or "application/yaml" or "text/yaml")
        {
            return true;
        }

        if (normalized is "application/pdf")
        {
            return true;
        }

        return extension is ".txt" or ".md" or ".json" or ".yaml" or ".yml" or ".pdf"
            or ".png" or ".jpg" or ".jpeg" or ".gif" or ".webp";
    }

    private static bool IsUnsafeInlineContentType(string? contentType)
    {
        string normalized = (contentType ?? string.Empty).Trim().ToLowerInvariant();

        return normalized is "text/html" or "application/xhtml+xml" or "image/svg+xml";
    }
}
