using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api;

/// <summary>
///     Returns stored evidence bytes with configurable inline vs attachment disposition and optional HTTP Range support.
/// </summary>
public sealed class StoredEvidenceFileContentResult(
    HttpRequest request,
    byte[] fileContents,
    string contentType,
    string fileDownloadName,
    bool inlineDisposition)
    : IActionResult
{
    public async Task ExecuteResultAsync(ActionContext context)
    {
        HttpResponse response = context.HttpContext.Response;
        response.Headers["Accept-Ranges"] = "bytes";

        long totalLength = fileContents.LongLength;
        string dispositionType = inlineDisposition ? "inline" : "attachment";
        string encodedFileName = fileDownloadName.Replace("\\", "\\\\").Replace("\"", "\\\"");

        if (totalLength == 0)
        {
            response.ContentLength = 0;
            response.StatusCode = StatusCodes.Status200OK;
            response.ContentType = contentType;
            response.Headers["Content-Disposition"] = $"{dispositionType}; filename=\"{encodedFileName}\"";

            return;
        }

        (long Start, long End)? range = ParseRange(request.Headers.Range, totalLength);

        if (range is { Start: var start, End: var end })
        {
            long length = end - start + 1;
            response.StatusCode = StatusCodes.Status206PartialContent;
            response.Headers["Content-Range"] = $"bytes {start}-{end}/{totalLength}";
            response.ContentLength = length;
            response.ContentType = contentType;
            response.Headers["Content-Disposition"] = $"{dispositionType}; filename=\"{encodedFileName}\"";

            await response.Body.WriteAsync(
                fileContents.AsMemory((int)start, (int)length),
                context.HttpContext.RequestAborted);

            return;
        }

        response.StatusCode = StatusCodes.Status200OK;
        response.ContentLength = totalLength;
        response.ContentType = contentType;
        response.Headers["Content-Disposition"] = $"{dispositionType}; filename=\"{encodedFileName}\"";
        await response.Body.WriteAsync(fileContents, context.HttpContext.RequestAborted);
    }

    private static (long Start, long End)? ParseRange(string? rangeHeader, long totalLength)
    {
        if (string.IsNullOrWhiteSpace(rangeHeader) || totalLength <= 0)
        {
            return null;
        }

        string value = rangeHeader.Trim();

        if (!value.StartsWith("bytes=", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        string spec = value["bytes=".Length..].Trim();
        int dash = spec.IndexOf('-');

        if (dash < 0)
        {
            return null;
        }

        string startStr = spec[..dash].Trim();
        string endStr = spec[(dash + 1)..].Trim();

        if (string.IsNullOrEmpty(startStr) && string.IsNullOrEmpty(endStr))
        {
            return null;
        }

        long start;
        long end;

        if (string.IsNullOrEmpty(startStr))
        {
            if (!long.TryParse(endStr, out long suffix) || suffix <= 0)
            {
                return null;
            }

            start = Math.Max(0, totalLength - suffix);
            end = totalLength - 1;
        }
        else if (string.IsNullOrEmpty(endStr))
        {
            if (!long.TryParse(startStr, out start) || start < 0)
            {
                return null;
            }

            end = totalLength - 1;
        }
        else
        {
            if (!long.TryParse(startStr, out start) || !long.TryParse(endStr, out end))
            {
                return null;
            }

            if (start < 0 || end < start)
            {
                return null;
            }

            if (end >= totalLength)
            {
                end = totalLength - 1;
            }
        }

        if (start >= totalLength)
        {
            return null;
        }

        return (start, end);
    }
}
