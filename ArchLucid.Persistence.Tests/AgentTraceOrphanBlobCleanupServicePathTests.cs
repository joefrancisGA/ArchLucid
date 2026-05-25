using ArchLucid.Persistence.Archival;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

public sealed class AgentTraceOrphanBlobCleanupServicePathTests
{
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
