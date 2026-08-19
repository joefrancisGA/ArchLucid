using ArchLucid.Application.Integrations.Itsm;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantItsmOutboundSettingsUpsertValidationTests
{
    [Fact]
    public void TryValidateJiraProjectKeyOverride_accepts_null_and_alphanumeric()
    {
        TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraProjectKeyOverride(null, out string? trimmed, out string? error)
            .Should().BeTrue();
        trimmed.Should().BeNull();
        error.Should().BeNull();

        TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraProjectKeyOverride("ARCH-1", out trimmed, out error)
            .Should().BeTrue();
        trimmed.Should().Be("ARCH-1");
    }

    [Fact]
    public void TryValidateJiraProjectKeyOverride_rejects_invalid_characters()
    {
        TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraProjectKeyOverride("bad key", out _, out string? error)
            .Should().BeFalse();
        error.Should().Contain("letters");
    }

    [Fact]
    public void TryValidateJiraIssueTypeBySeverityJson_requires_object()
    {
        TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraIssueTypeBySeverityJson("[]", out _, out string? error)
            .Should().BeFalse();
        error.Should().Contain("JSON object");
    }

    [Fact]
    public void TryValidateJiraIssueTypeBySeverityJson_accepts_valid_object()
    {
        TenantItsmOutboundSettingsUpsertValidation.TryValidateJiraIssueTypeBySeverityJson(
                "{\"Critical\":\"Bug\"}",
                out string? trimmed,
                out string? error)
            .Should().BeTrue();
        trimmed.Should().Contain("Critical");
        error.Should().BeNull();
    }
}
