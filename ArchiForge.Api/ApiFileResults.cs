using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace ArchiForge.Api;

public static class ApiFileResults
{
    public static IActionResult RangeText(
        HttpRequest request,
        string? content,
        string contentType,
        string fileName)
    {
        var bytes = Encoding.UTF8.GetBytes(content ?? string.Empty);
        return new FileWithRangeResult(request, bytes, contentType, fileName);
    }

    public static IActionResult RangeBytes(
        HttpRequest request,
        byte[]? bytes,
        string contentType,
        string fileName)
    {
        return new FileWithRangeResult(request, bytes ?? Array.Empty<byte>(), contentType, fileName);
    }
}

