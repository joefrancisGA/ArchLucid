using ArchLucid.Application.Evidence;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api;

public static class StoredEvidenceFileHttpResults
{
    public static IActionResult Respond(
        HttpRequest request,
        byte[] bytes,
        string contentType,
        string fileName,
        bool inlineRequested)
    {
        bool forceAttachment = StoredEvidenceFileContentSafety.MustForceAttachmentDisposition(contentType, fileName);
        bool inline = inlineRequested && !forceAttachment;

        return new StoredEvidenceFileContentResult(request, bytes, contentType, fileName, inline);
    }
}
