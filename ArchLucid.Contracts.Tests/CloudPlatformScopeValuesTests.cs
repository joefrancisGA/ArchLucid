using ArchLucid.Contracts.User;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class CloudPlatformScopeValuesTests
{
    [Fact]
    public void Serialize_uses_evidence_only_key()
    {
        string json = CloudPlatformScopeValues.Serialize(
            new CloudPlatformScopeDto
            {
                EvidenceOnly = true,
                Azure = false,
                Aws = true,
                Gcp = false,
            });

        json.Should().Be("""{"evidence-only":true,"azure":false,"aws":true,"gcp":false}""");
    }

    [Fact]
    public void TryParse_returns_null_for_invalid_json()
    {
        CloudPlatformScopeValues.TryParse("{not-json").Should().BeNull();
    }

    [Fact]
    public void NormalizeOrDefault_falls_back_when_unset()
    {
        CloudPlatformScopeDto scope = CloudPlatformScopeValues.NormalizeOrDefault(null);

        scope.EvidenceOnly.Should().BeTrue();
        scope.Azure.Should().BeTrue();
        scope.Aws.Should().BeTrue();
        scope.Gcp.Should().BeTrue();
    }
}
