namespace ArchiForge.Application.Analysis;

public sealed class FileSystemDocumentLogoProvider : IDocumentLogoProvider
{
    public async Task<byte[]?> GetLogoBytesAsync(
        ConsultingDocxTemplateOptions options,
        CancellationToken cancellationToken = default)
    {
        if (!options.IncludeLogo)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(options.LogoPath))
        {
            return null;
        }

        if (!File.Exists(options.LogoPath))
        {
            return null;
        }

        return await File.ReadAllBytesAsync(options.LogoPath, cancellationToken);
    }
}

