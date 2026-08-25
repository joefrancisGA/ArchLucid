using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsIamRoleArnTests
{
    [Fact]
    public void TryGetAccountId_accepts_aws_us_gov_partition_role_arn()
    {
        const string roleArn = "arn:aws-us-gov:iam::123456789012:role/ReadOnly";

        bool parsed = AwsIamRoleArn.TryGetAccountId(roleArn, out string accountId);

        parsed.Should().BeTrue();
        accountId.Should().Be("123456789012");
    }

    [Fact]
    public void EnsureAccountMatches_accepts_aws_us_gov_partition_role_arn()
    {
        const string roleArn = "arn:aws-us-gov:iam::123456789012:role/ReadOnly";

        Action act = () => AwsIamRoleArn.EnsureAccountMatches("123456789012", roleArn);

        act.Should().NotThrow();
    }
}
