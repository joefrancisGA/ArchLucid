using System.Text;

using ArchLucid.Api.Models;
using ArchLucid.Api.Services;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

public sealed class BatchReplayManifestSerializerTests
{
    [SkippableFact]
    public void ToUtf8Bytes_IncludesCamelCaseProperties()
    {
        BatchReplayManifestDocument doc = new()
        {
            GeneratedUtc = "2026-03-31T12:00:00.0000000Z",
            ProcessedComparisonRecordIds = ["a"],
            Succeeded =
            [
                new BatchReplayManifestSuccessEntry { ComparisonRecordId = "a", ZipEntryPath = "a/report.md" }
            ],
            Failed = []
        };

        byte[] bytes = BatchReplayManifestSerializer.ToUtf8Bytes(doc);
        string json = Encoding.UTF8.GetString(bytes);

        json.Should().Contain("generatedUtc");
        json.Should().Contain("zipEntryPath");
        json.Should().Contain("a/report.md");
    }

    [SkippableFact]
    public void ProblemErrorCodes_MapsBatchReplayAllFailedType()
    {
        string code = ProblemErrorCodes.ResolveFromProblemType(ProblemTypes.BatchReplayAllFailed);
        code.Should().Be(ProblemErrorCodes.BatchReplayAllFailed);
    }
}
