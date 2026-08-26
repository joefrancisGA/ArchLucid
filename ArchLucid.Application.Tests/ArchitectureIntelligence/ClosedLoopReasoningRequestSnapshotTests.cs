using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopReasoningRequestSnapshotTests
{
    [Fact]
    public void Capture_creates_independent_copy_of_request_inputs()
    {
        ClosedLoopReasoningSourceText source = new()
        {
            FileName = "architecture.md",
            ContentType = "text/markdown",
            Content = "Public API exposes customer records without authentication.",
        };

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-snapshot",
            RunId = "run-snapshot",
            DeclaredPriorities = ["Security"],
            FramingAnswers = new Dictionary<string, string> { ["goal"] = "scale" },
            SourceTexts = [source],
        };

        ClosedLoopReasoningRequest snapshot = ClosedLoopReasoningRequestSnapshot.Capture(request);

        snapshot.DeclaredPriorities.Add("Cost");
        snapshot.FramingAnswers["goal"] = "mutated";
        snapshot.SourceTexts[0].Content = "mutated";
        request.DeclaredPriorities.Add("Reliability");
        request.FramingAnswers["goal"] = "original-changed";
        source.Content = "original-changed";

        snapshot.DeclaredPriorities.Should().Equal("Security", "Cost");
        snapshot.FramingAnswers["goal"].Should().Be("mutated");
        snapshot.SourceTexts[0].Content.Should().Be("mutated");
        request.DeclaredPriorities.Should().Equal("Security", "Reliability");
        request.FramingAnswers["goal"].Should().Be("original-changed");
        source.Content.Should().Be("original-changed");
    }
}
