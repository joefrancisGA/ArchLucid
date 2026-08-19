using ArchLucid.Host.Core.Services;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthDiagnosticsRingBufferTests
{
    [Fact]
    public void GetRecent_evicts_oldest_when_capacity_exceeded()
    {
        AuthDiagnosticEntry first = CreateEntry("first");
        AuthDiagnosticEntry second = CreateEntry("second");
        AuthDiagnosticsRingBuffer sut = new(capacity: 1);

        sut.Record(first);
        sut.Record(second);

        IReadOnlyList<AuthDiagnosticEntry> recent = sut.GetRecent(maxCount: 10);

        recent.Should().HaveCount(1);
        recent[0].Reason.Should().Be("second");
    }

    [Fact]
    public void GetRecent_caps_tail_slice()
    {
        AuthDiagnosticsRingBuffer sut = new(capacity: 10);

        for (int i = 0; i < 5; i++)
            sut.Record(CreateEntry($"r{i}"));

        IReadOnlyList<AuthDiagnosticEntry> tail = sut.GetRecent(maxCount: 2);

        tail.Should().HaveCount(2);
        tail[0].Reason.Should().Be("r3");
        tail[1].Reason.Should().Be("r4");
    }

    [Fact]
    public void Constructor_clamps_invalid_capacity_to_default()
    {
        AuthDiagnosticsRingBuffer sut = new(capacity: 0);

        for (int i = 0; i < 250; i++)
            sut.Record(CreateEntry($"x{i}"));

        sut.GetRecent(maxCount: 500).Count.Should().Be(200);
    }

    private static AuthDiagnosticEntry CreateEntry(string reason) =>
        new() { TimestampUtc = DateTime.UtcNow, Reason = reason };
}
