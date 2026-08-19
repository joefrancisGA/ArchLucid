using System.Text.Json;

using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// <see cref="JsonEntitySerializer"/> wraps <see cref="System.Text.Json.JsonException"/> so SQL mappers fail with a single, typed message.
/// </summary>
[Trait("Category", "Unit")]
public sealed class JsonEntitySerializerCorruptTests
{
    [Fact]
    public void Deserialize_ThrowsInvalidOperation_WhenJsonIsEmpty()
    {
        Action act = () => JsonEntitySerializer.Deserialize<List<GraphNode>>("   ");

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("Cannot deserialize empty JSON*");
    }

    [Fact]
    public void Deserialize_ThrowsInvalidOperation_WithJsonExceptionInner_WhenJsonIsMalformed()
    {
        const string corrupt = "{ not valid json";

        Action act = () => JsonEntitySerializer.Deserialize<List<GraphNode>>(corrupt);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*corrupt*")
            .WithInnerException<JsonException>();
    }
}
