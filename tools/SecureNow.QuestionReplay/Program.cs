using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

if (args.Length is not (4 or 5) ||
    args[0] != "--zip" || args[2] != "--out" ||
    (args.Length == 5 && args[4] != "--include-identifiers"))
{
    Console.Error.WriteLine(
        "Usage: dotnet run --project tools/SecureNow.QuestionReplay -- " +
        "--zip <existing-evidence.zip> --out <local-report.json> [--include-identifiers]");
    return 2;
}

string zipPath = Path.GetFullPath(args[1]);
string outPath = Path.GetFullPath(args[3]);
bool includeIdentifiers = args.Length == 5;

try
{
    FileInfo info = new(zipPath);
    if (!info.Exists || info.Length == 0 || info.Length > SecureNowOfflineQuestionReplay.MaximumZipBytes)
        throw new InvalidDataException("Input ZIP is missing, empty or over the offline size limit.");

    byte[] bytes = await File.ReadAllBytesAsync(zipPath);
    SecureNowOfflineQuestionReplayResult replay = SecureNowOfflineQuestionReplay.Replay(bytes);

    var output = new
    {
        schema = "securenow.offline-native-questions.v1",
        status = "PARTIAL_QUESTION_REPLAY",
        limitations = new[]
        {
            "Uses production Azure ZIP reader, security-edge projector and diagram-question compiler.",
            "Does NOT execute SQL-backed path engines, stored inferred connections, policy packs, existing dispositions, or API authorization.",
            "Absence of a resource or edge is NOT a favorable security finding and does not establish access denial.",
            "Generated question count is a subset of the complete SecureNow question queue.",
            "Raw customer ZIP input and output remain tenant-confidential.",
        },
        replay.SubscriptionId,
        replay.PackageSha256,
        replay.CaptureUtc,
        replay.ResourceCount,
        replay.RelationshipCount,
        replay.CompletenessWarningCount,
        replay.DiagramCandidates,
        questionCount = replay.Questions.Count,
        questions = replay.Questions.Select(q => new
        {
            q.QuestionKey,
            source = q.Source.ToString(),
            scope = q.ScopeKind.ToString(),
            q.EvidenceFingerprint,
            resourceId = includeIdentifiers ? q.ResourceId : null,
            resourceSha256 = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(q.ResourceId))).ToLowerInvariant(),
            questionText = includeIdentifiers ? q.QuestionText : null,
            reasonText = includeIdentifiers ? q.ReasonText : null,
            status = "Open",
            answeredByReplay = false,
        }).ToList(),
    };

    Directory.CreateDirectory(Path.GetDirectoryName(outPath)!);
    await File.WriteAllTextAsync(outPath,
        JsonSerializer.Serialize(output, new JsonSerializerOptions { WriteIndented = true }) + "\n");
    Console.WriteLine(
        $"Offline native question replay: {replay.ResourceCount} resources, " +
        $"{replay.RelationshipCount} relationships, {replay.Questions.Count} partial questions.");
    return 0;
}
catch (Exception ex) when (ex is IOException or UnauthorizedAccessException
                           or InvalidDataException or JsonException)
{
    Console.Error.WriteLine($"SecureNow offline native replay failed: {ex.Message}");
    return 2;
}
