using System.IO.Compression;
using System.Text.Json;

namespace ArchLucid.Application.Tests.Exports;

internal static class ExportRoundTripTestReader
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    internal static T Deserialize<T>(string payload) where T : class =>
        JsonSerializer.Deserialize<T>(payload, JsonOptions) ??
        throw new InvalidDataException($"The exported {typeof(T).Name} was null.");

    internal static async Task<string> ReadEntryTextAsync(byte[] archiveBytes, string entryName)
    {
        using MemoryStream source = new(archiveBytes);
        using ZipArchive archive = new(source, ZipArchiveMode.Read);
        ZipArchiveEntry entry = Assert.Single(archive.Entries, item => item.FullName == entryName);
        using StreamReader reader = new(entry.Open());
        return await reader.ReadToEndAsync();
    }
}
