namespace ArchLucid.Api.Security;

/// <summary>Defense in depth for a dedicated administrator-controlled local spool.
/// Path checks are not atomic with opening a file: OS ACLs and trusted atomic
/// publication remain mandatory. Do not use an attacker-writable directory.</summary>
internal static class RuntimeTelemetrySpoolPath
{
    internal static bool IsRegularFileUnderPlainDirectories(string path)
    {
        try
        {
            if (!Path.IsPathFullyQualified(path)) return false;
            var file = new FileInfo(path);
            var attributes = file.Attributes;
            if ((attributes & (FileAttributes.ReparsePoint | FileAttributes.Directory | FileAttributes.Device)) != 0)
                return false;
            for (DirectoryInfo? directory = file.Directory; directory is not null; directory = directory.Parent)
            {
                var flags = directory.Attributes;
                if ((flags & FileAttributes.Directory) == 0 ||
                    (flags & FileAttributes.ReparsePoint) != 0)
                    return false;
            }
            return true;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return false;
        }
    }
}
