using ArchLucid.Application.Agents.Evidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Category", "Unit")]
public sealed class ProposedEvidencePayloadValidatorTests
{
    [Fact]
    public void TryParseValid_WhenPolicyShape_ReturnsTrue()
    {
        bool ok = ProposedEvidencePayloadValidator.TryParseValid(
            """{"type":"Policy","title":"Encrypt data at rest","description":"All storage accounts use CMK.","rationale":"Gap in catalog."}""",
            out ProposedEvidencePayload payload);

        ok.Should().BeTrue();
        payload.Type.Should().Be("Policy");
        payload.Title.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void TryParseValid_WhenDescriptionIsInvisibleUnicodeOnly_ReturnsFalse()
    {
        bool ok = ProposedEvidencePayloadValidator.TryParseValid(
            """{"type":"Policy","title":"Encrypt data at rest","description":"\u200b","rationale":"Gap in catalog."}""",
            out ProposedEvidencePayload _);

        ok.Should().BeFalse();
    }

    [Fact]
    public void TryParseValid_WhenTypeIsNull_ReturnsFalse()
    {
        bool ok = ProposedEvidencePayloadValidator.TryParseValid(
            """{"type":null,"title":"Encrypt SQL TDE","description":"Require TDE."}""",
            out ProposedEvidencePayload _);

        ok.Should().BeFalse();
    }


    [Theory]
    [InlineData("""{"type":"Unknown","title":"x","description":"y"}""")]
    [InlineData("""{"type":"Policy","title":"","description":"y"}""")]
    [InlineData("not-json")]
    public void TryParseValid_WhenInvalid_ReturnsFalse(string json)
    {
        bool ok = ProposedEvidencePayloadValidator.TryParseValid(json, out ProposedEvidencePayload _);

        ok.Should().BeFalse();
    }
}
