using ArchLucid.Persistence.Archival;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentTraceOrphanBlobCleanupServicePathTests
{
    [Fact]
    public void DeleteLocalOrphanFiles_prunes_run_directories_and_keeps_storage_root()
    {
        string parent = Directory.CreateTempSubdirectory().FullName;
        try
        {
            File.WriteAllText(Path.Combine(parent, "keep.txt"), "outside storage");
            string root = Path.Combine(parent, "blob-store");
            string container = Path.Combine(root, AgentTraceOrphanBlobPathParser.AgentTracesContainer);
            string runDirectory = Path.Combine(container, Guid.NewGuid().ToString("D"), Guid.NewGuid().ToString("D"));
            string traceDirectory = Directory.CreateDirectory(Path.Combine(runDirectory, "trace")).FullName;
            string trace = Path.Combine(traceDirectory, "trace.txt");
            File.WriteAllText(trace, "orphan");

            AgentTraceOrphanBlobDeleter.DeleteLocalOrphanFiles([trace], container).Should().Be(1);

            Directory.Exists(runDirectory).Should().BeFalse();
            Directory.Exists(container).Should().BeTrue();
            Directory.Exists(root).Should().BeTrue();
        }
        finally
        {
            Directory.Delete(parent, recursive: true);
        }
    }

    [Theory]
    [InlineData("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/11111111-2222-3333-4444-555555555555/trace/system-prompt.txt", true)]
    [InlineData("not-a-guid/11111111-2222-3333-4444-555555555555/trace/file.txt", false)]
    public void TryParseRunPrefixFromBlobName_parses_tenant_and_run_segments(string blobName, bool expected)
    {
        bool ok = AgentTraceOrphanBlobCleanupService.TryParseRunPrefixFromBlobName(blobName, out string runPrefix);

        ok.Should().Be(expected);

        if (expected)
        {
            runPrefix.Should().Be("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/11111111-2222-3333-4444-555555555555");
            AgentTraceOrphanBlobCleanupService.TryParseRunIdFromRunPrefix(runPrefix, out Guid runId).Should().BeTrue();
            runId.Should().Be(Guid.Parse("11111111-2222-3333-4444-555555555555"));
        }
    }
}
