using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackSimulateRequestValidatorTests
{
    private readonly PolicyPackSimulateRequestValidator _validator = new();

    [Fact]
    public void Valid_request_passes()
    {
        PolicyPackSimulateRequest request = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            Content = new PolicyPackContentDocument(),
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Missing_run_id_fails()
    {
        PolicyPackSimulateRequest request = new()
        {
            RunId = "",
            Content = new PolicyPackContentDocument(),
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Empty_proposed_policy_pack_id_fails()
    {
        PolicyPackSimulateRequest request = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            Content = new PolicyPackContentDocument(),
            ProposedPolicyPackId = Guid.Empty,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PolicyPackSimulateRequest.ProposedPolicyPackId));
    }

    [Fact]
    public void Severity_out_of_range_fails()
    {
        PolicyPackSimulateRequest request = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            Content = new PolicyPackContentDocument(),
            BlockCommitMinimumSeverity = 9,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
