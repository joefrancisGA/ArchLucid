using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Evidence;

public sealed partial class BulkEvidenceUploadService
{
    private static bool IsZipArchive(IFormFile file)
    {
        if (file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) ||
            file.ContentType.Equals("application/zip", StringComparison.OrdinalIgnoreCase) ||
            file.ContentType.Equals("application/x-zip-compressed", StringComparison.OrdinalIgnoreCase))
        {
            using Stream stream = file.OpenReadStream();
            if (stream.Length >= 4)
            {
                byte[] buffer = new byte[4];
                if (stream.Read(buffer, 0, 4) == 4)
                {
                    return buffer[0] == 0x50 && buffer[1] == 0x4B && buffer[2] == 0x03 && buffer[3] == 0x04;
                }
            }
        }

        return false;
    }
}
