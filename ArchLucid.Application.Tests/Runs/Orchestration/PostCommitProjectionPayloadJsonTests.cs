using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PostCommitProjectionPayloadJsonTests
{
    [Fact]
    public void Serialize_and_deserialize_round_trip_project_id()
    {
        PostCommitProjectionPayload payload = new() { ProjectId = "project-1" };

        string json = PostCommitProjectionPayloadJson.Serialize(payload);
        PostCommitProjectionPayload? restored = PostCommitProjectionPayloadJson.Deserialize(json);

        restored.Should().NotBeNull();
        restored!.ProjectId.Should().Be("project-1");
    }

    [Fact]
    public void Deserialize_null_or_whitespace_returns_null()
    {
        PostCommitProjectionPayloadJson.Deserialize(null).Should().BeNull();
        PostCommitProjectionPayloadJson.Deserialize("   ").Should().BeNull();
    }
}
