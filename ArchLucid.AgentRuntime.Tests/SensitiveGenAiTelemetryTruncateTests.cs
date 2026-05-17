using ArchLucid.AgentRuntime;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class SensitiveGenAiTelemetryTruncateTests
{
    [Fact]
    public void TruncateForSensitiveTelemetrySnapshot_truncatesBeyondCap()
    {
        string oversized = new string('a', ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars + 128);

        string trimmed = AzureOpenAiCompletionClient.TruncateForSensitiveTelemetrySnapshot(oversized);

        trimmed.Should().EndWith("…truncated");

        trimmed.Length.Should()
            .Be(ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars + "…truncated".Length);
    }

    [Fact]
    public void TruncateForSensitiveTelemetrySnapshot_returns_empty_when_input_empty()
    {
        AzureOpenAiCompletionClient.TruncateForSensitiveTelemetrySnapshot(string.Empty).Should().BeEmpty();
    }

    [Fact]
    public void TruncateForSensitiveTelemetrySnapshot_returns_original_when_below_cap()
    {
        AzureOpenAiCompletionClient.TruncateForSensitiveTelemetrySnapshot("ok").Should().Be("ok");
    }
}
