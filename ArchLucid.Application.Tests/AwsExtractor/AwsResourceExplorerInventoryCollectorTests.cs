using Amazon.ResourceExplorer2;
using Amazon.ResourceExplorer2.Model;

using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsResourceExplorerInventoryCollectorTests
{
    [Fact]
    public async Task SearchResourcesAsync_paginates_until_next_token_exhausted()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(
                It.Is<SearchRequest>(r => r.NextToken == null),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources = [
                    new Resource { Arn = "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-1", ResourceType = "AWS::EC2::VPC" }
                ],
                NextToken = "page-2"
            });

        explorerClient
            .Setup(c => c.SearchAsync(
                It.Is<SearchRequest>(r => r.NextToken == "page-2"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources = [
                    new Resource
                    {
                        Arn = "arn:aws:s3:::bucket-1",
                        ResourceType = "AWS::S3::Bucket"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().HaveCount(2);
        resources[0].Name.Should().Contain("vpc-1");
        resources[1].Name.Should().Contain("bucket-1");

        explorerClient.Verify(
            c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task CollectAsync_uses_resource_region_not_connection_region()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws:ec2:eu-west-1:123456789012:instance/i-abc",
                        ResourceType = "AWS::EC2::Instance",
                        Region = "eu-west-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().Be("eu-west-1");
    }

    [Fact]
    public async Task CollectAsync_trims_connection_region_when_resource_region_missing()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws-cn:s3:::bucket-1",
                        ResourceType = "AWS::S3::Bucket",
                        Region = null
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            " cn-north-1 ",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().Be("cn-north-1");
    }

    [Fact]
    public async Task CollectAsync_uses_china_partition_query_when_connection_region_has_bounding_whitespace()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        string? capturedQuery = null;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SearchRequest, CancellationToken>((request, _) => capturedQuery = request.QueryString)
            .ReturnsAsync(new SearchResponse
            {
                Resources = [],
                NextToken = null
            });

        await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "  cn-north-1  ",
            CancellationToken.None);

        capturedQuery.Should().Be("arn:aws-cn:*");
    }

    [Fact]
    public async Task CollectAsync_trims_bounded_whitespace_on_connection_region_before_search()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        string? capturedQuery = null;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SearchRequest, CancellationToken>((request, _) => capturedQuery = request.QueryString)
            .ReturnsAsync(new SearchResponse
            {
                Resources = [],
                NextToken = null
            });

        await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "  us-east-1  ",
            CancellationToken.None);

        capturedQuery.Should().Be("arn:aws:*");
    }

    [Fact]
    public async Task CollectAsync_uses_iso_b_partition_query_for_us_isob_region()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        string? capturedQuery = null;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SearchRequest, CancellationToken>((request, _) => capturedQuery = request.QueryString)
            .ReturnsAsync(new SearchResponse
            {
                Resources = [],
                NextToken = null
            });

        await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-isob-east-1",
            CancellationToken.None);

        capturedQuery.Should().Be("arn:aws-iso-b:*");
    }

    [Fact]
    public async Task CollectAsync_uses_iso_partition_query_for_us_iso_region()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        string? capturedQuery = null;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SearchRequest, CancellationToken>((request, _) => capturedQuery = request.QueryString)
            .ReturnsAsync(new SearchResponse
            {
                Resources = [],
                NextToken = null
            });

        await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-iso-east-1",
            CancellationToken.None);

        capturedQuery.Should().Be("arn:aws-iso:*");
    }

    [Fact]
    public async Task CollectAsync_uses_govcloud_partition_query_for_us_gov_region()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        string? capturedQuery = null;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SearchRequest, CancellationToken>((request, _) => capturedQuery = request.QueryString)
            .ReturnsAsync(new SearchResponse
            {
                Resources = [],
                NextToken = null
            });

        await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-gov-west-1",
            CancellationToken.None);

        capturedQuery.Should().Be("arn:aws-us-gov:*");
    }

    [Fact]
    public async Task CollectAsync_omits_resources_without_arn()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = null,
                        ResourceType = "AWS::S3::Bucket",
                        Region = "us-east-1"
                    },
                    new Resource
                    {
                        Arn = "arn:aws:s3:::valid-bucket",
                        ResourceType = "AWS::S3::Bucket",
                        Region = "us-east-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Name.Should().Be("arn:aws:s3:::valid-bucket");
    }

    [Fact]
    public async Task CollectAsync_omits_resource_when_arn_is_whitespace_only_even_if_resource_type_is_present()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "   ",
                        ResourceType = " AWS::S3::Bucket ",
                        Region = "us-east-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().BeEmpty();
    }

    [Fact]
    public async Task CollectAsync_retains_resource_with_empty_resource_type_when_arn_is_present()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws:s3:::bucket-no-type",
                        ResourceType = null,
                        Region = "us-east-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].ResourceType.Should().BeEmpty();
        resources[0].Name.Should().Be("arn:aws:s3:::bucket-no-type");
    }

    [Fact]
    public async Task CollectAsync_retains_resource_when_arn_has_bounding_whitespace()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = " arn:aws:s3:::padded-bucket ",
                        ResourceType = "AWS::S3::Bucket",
                        Region = "us-east-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Name.Should().Be("arn:aws:s3:::padded-bucket");
    }

    [Fact]
    public async Task CollectAsync_trims_resource_region_when_region_has_bounding_whitespace()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws:ec2:eu-west-1:123456789012:instance/i-abc",
                        ResourceType = "AWS::EC2::Instance",
                        Region = " eu-west-1 "
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().Be("eu-west-1");
    }

    [Fact]
    public async Task CollectAsync_trims_resource_type_when_resource_type_has_bounding_whitespace()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws:s3:::bucket-1",
                        ResourceType = " AWS::S3::Bucket ",
                        Region = "us-east-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].ResourceType.Should().Be("AWS::S3::Bucket");
    }

    [Fact]
    public async Task CollectAsync_retains_resources_when_max_pagination_limit_reached()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        int requestCount = 0;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                int page = Interlocked.Increment(ref requestCount);

                return new SearchResponse
                {
                    Resources =
                    [
                        new Resource
                        {
                            Arn = $"arn:aws:ec2:us-east-1:123456789012:vpc/vpc-{page}",
                            ResourceType = "AWS::EC2::VPC"
                        }
                    ],
                    NextToken = $"page-{page}"
                };
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        requestCount.Should().Be(64);
        resources.Should().HaveCount(64);
        resources[0].Name.Should().Contain("vpc-1");
        resources[^1].Name.Should().Contain("vpc-64");
    }

    [Fact]
    public async Task CollectAsync_throws_when_connection_region_is_whitespace_only()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new(MockBehavior.Strict);

        Func<Task> act = () => AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "   ",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task CollectAsync_uses_connection_region_when_resource_region_is_whitespace_only()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws:ec2:us-east-1:123456789012:instance/i-abc",
                        ResourceType = "AWS::EC2::Instance",
                        Region = "   "
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().Be("us-east-1");
    }

    [Fact]
    public async Task CollectAsync_retains_resources_when_next_token_repeats()
    {
        const string repeatingToken = "repeat-token";
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        int requestCount = 0;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current > 3)
                {
                    throw new InvalidOperationException(
                        "Test hang guard: AWS Resource Explorer listing did not stop on repeating NextToken.");
                }

                return new SearchResponse
                {
                    Resources =
                    [
                        new Resource
                        {
                            Arn = $"arn:aws:ec2:us-east-1:123456789012:vpc/vpc-{current}",
                            ResourceType = "AWS::EC2::VPC"
                        }
                    ],
                    NextToken = repeatingToken
                };
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        requestCount.Should().Be(2);
        resources.Should().HaveCount(2);
        resources[0].Name.Should().Contain("vpc-1");
        resources[1].Name.Should().Contain("vpc-2");
    }
}
