using System.Reflection;

namespace ArchiForge.ArtifactSynthesis.Docx;

public static class TemplateLoader
{
    private const string FileName = "architecture-template.docx";

    /// <summary>Writable copy suitable for opening with the Open XML SDK (read/write).</summary>
    public static MemoryStream OpenWritableTemplate()
    {
        var bytes = TryLoadFromDisk() ?? BrandedArchitectureTemplateGenerator.CreateTemplateBytes();
        var ms = new MemoryStream();
        ms.Write(bytes, 0, bytes.Length);
        ms.Position = 0;
        return ms;
    }

    private static byte[]? TryLoadFromDisk()
    {
        foreach (var dir in GetSearchDirectories())
        {
            var path = Path.Combine(dir, "Docx", "Templates", FileName);
            if (File.Exists(path))
                return File.ReadAllBytes(path);
        }

        return null;
    }

    private static IEnumerable<string> GetSearchDirectories()
    {
        yield return AppContext.BaseDirectory;

        var loc = Assembly.GetExecutingAssembly().Location;
        if (!string.IsNullOrEmpty(loc))
        {
            var bin = Path.GetDirectoryName(loc);
            if (!string.IsNullOrEmpty(bin))
                yield return bin;
        }
    }
}
