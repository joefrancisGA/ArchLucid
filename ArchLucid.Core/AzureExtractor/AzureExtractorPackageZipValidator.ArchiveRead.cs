using System.IO.Compression;

using ArchLucid.Core.Compression;

namespace ArchLucid.Core.AzureExtractor;

public static partial class AzureExtractorPackageZipValidator
{
    public static AzureExtractorZipValidationResult ValidateFile(string zipPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        string fullPath = Path.GetFullPath(zipPath.Trim());

        if (!File.Exists(fullPath))
        {
            return new AzureExtractorZipValidationResult
            {
                IsValid = false,
                ErrorDetail = $"ZIP file not found: {fullPath}",
                IsInvalidArchive = false,
                IsSchemaRejection = false,
            };
        }

        using FileStream stream = new(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);

        return Validate(stream);
    }

    public static AzureExtractorZipValidationResult Validate(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try
        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            ZipArchiveSafetyResult safety = ZipArchiveSafety.ValidateArchive(archive);

            if (!safety.Allowed)
            {
                return new AzureExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = safety.ErrorDetail ?? "ZIP archive failed safety validation.",
                    IsSchemaRejection = false,
                    IsInvalidArchive = true,
                };
            }

            int fileEntryCount = safety.FileEntryCount;
            ZipArchiveEntry? manifestEntry = FindEntry(archive, ManifestEntryName);

            if (manifestEntry is null)
            {
                return new AzureExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = "ZIP does not contain manifest.json.",
                    IsSchemaRejection = true,
                    FileEntryCount = fileEntryCount,
                };
            }

            string? schemaError = TryReadManifestSchemaError(manifestEntry);

            if (schemaError is not null)
            {
                return new AzureExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = schemaError,
                    IsSchemaRejection = true,
                    FileEntryCount = fileEntryCount,
                };
            }

            ZipArchiveEntry? resourcesEntry = FindEntry(archive, ResourcesEntryName);

            if (resourcesEntry is null)
            {
                return new AzureExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = "ZIP does not contain resources.json (required extractor output).",
                    IsSchemaRejection = false,
                    FileEntryCount = fileEntryCount,
                };
            }

            return new AzureExtractorZipValidationResult
            {
                IsValid = true,
                FileEntryCount = fileEntryCount,
            };
        }
        catch (InvalidDataException)
        {
            return new AzureExtractorZipValidationResult
            {
                IsValid = false,
                ErrorDetail = "Uploaded payload is not a valid ZIP archive.",
                IsInvalidArchive = true,
            };
        }
    }

    public static int CountFileEntries(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

        return archive.Entries.Count(static entry => !entry.FullName.EndsWith('/'));
    }

    private static ZipArchiveEntry? FindEntry(ZipArchive archive, string entryName)
    {
        ArgumentNullException.ThrowIfNull(archive);

        return archive.GetEntry(entryName)
               ?? archive.Entries.FirstOrDefault(entry =>
                   entryName.Equals(entry.Name, StringComparison.OrdinalIgnoreCase));
    }
}
