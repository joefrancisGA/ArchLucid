using System.Text.Json.Nodes;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class OpenApiJsonCanonicalizerTests
{
    [SkippableFact]
    public void Canonicalize_sorts_openapi_document_tag_objects_by_name()
    {
        JsonNode? left = JsonNode.Parse("""{"tags":[{"name":"Zebra"},{"name":"Apple"}]}""");
        JsonNode? right = JsonNode.Parse("""{"tags":[{"name":"Apple"},{"name":"Zebra"}]}""");

        left.Should().NotBeNull();
        right.Should().NotBeNull();

        JsonNode canonicalLeft = OpenApiJsonCanonicalizer.Canonicalize(left);
        JsonNode canonicalRight = OpenApiJsonCanonicalizer.Canonicalize(right);

        JsonNode.DeepEquals(canonicalLeft, canonicalRight).Should().BeTrue();
    }

    [SkippableFact]
    public void Canonicalize_sorts_schema_required_property_name_arrays_when_order_differs_only()
    {
        JsonNode? left = JsonNode.Parse("""{"required":["zebra","alpha","moon"]}""");
        JsonNode? right = JsonNode.Parse("""{"required":["alpha","moon","zebra"]}""");

        left.Should().NotBeNull();
        right.Should().NotBeNull();

        JsonNode canonicalLeft = OpenApiJsonCanonicalizer.Canonicalize(left);
        JsonNode canonicalRight = OpenApiJsonCanonicalizer.Canonicalize(right);

        JsonNode.DeepEquals(canonicalLeft, canonicalRight).Should().BeTrue();
    }

    [SkippableFact]
    public void Canonicalize_sorts_operation_level_string_tag_arrays()
    {
        JsonNode? left = JsonNode.Parse("""{"paths":{"/x":{"get":{"tags":["Zulu","Alpha"]}}}}""");
        JsonNode? right = JsonNode.Parse("""{"paths":{"/x":{"get":{"tags":["Alpha","Zulu"]}}}}""");

        left.Should().NotBeNull();
        right.Should().NotBeNull();

        JsonNode canonicalLeft = OpenApiJsonCanonicalizer.Canonicalize(left);
        JsonNode canonicalRight = OpenApiJsonCanonicalizer.Canonicalize(right);

        JsonNode.DeepEquals(canonicalLeft, canonicalRight).Should().BeTrue();
    }
}
