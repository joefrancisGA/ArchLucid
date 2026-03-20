namespace ArchiForge.ArtifactSynthesis.Packaging;

public static class FileNameSanitizer
{
    public static string Sanitize(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Select(c => invalid.Contains(c) ? '_' : c).ToArray());

        return string.IsNullOrWhiteSpace(sanitized) ? "artifact.txt" : sanitized;
    }
}
