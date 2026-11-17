using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Models;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PagingParametersTests
{
    [SkippableFact]
    public void TryGetInvalidPageQueryDetail_rejects_invalid_page_number()
    {
        string? detail = PagingParameters.TryGetInvalidPageQueryDetail(0, 50);

        detail.Should().Be("pageNumber must be at least 1.");
    }

    [SkippableFact]
    public void TryGetInvalidPageQueryDetail_rejects_invalid_page_size()
    {
        string? tooSmall = PagingParameters.TryGetInvalidPageQueryDetail(1, 0);
        string? tooLarge = PagingParameters.TryGetInvalidPageQueryDetail(1, PagingParameters.MaxPageSize + 1);

        tooSmall.Should().Contain("pageSize");
        tooLarge.Should().Contain("pageSize");
    }

    [SkippableFact]
    public void TryGetInvalidPageQueryDetail_accepts_valid_query()
    {
        PagingParameters.TryGetInvalidPageQueryDetail(1, PagingParameters.MaxPageSize).Should().BeNull();
    }

    [SkippableFact]
    public void Normalize_clamps_page_number_and_page_size()
    {
        PagingParameters paging = new() { PageNumber = 0, PageSize = 0 };

        (int skip, int take) = paging.Normalize();

        skip.Should().Be(0);
        take.Should().Be(1);
        paging.PageNumber.Should().Be(1);
        paging.PageSize.Should().Be(1);
    }

    [SkippableFact]
    public void Normalize_caps_page_size_at_max()
    {
        PagingParameters paging = new() { PageNumber = 2, PageSize = 500 };

        (int skip, int take) = paging.Normalize();

        skip.Should().Be(PagingParameters.MaxPageSize);
        take.Should().Be(PagingParameters.MaxPageSize);
        paging.PageSize.Should().Be(PagingParameters.MaxPageSize);
    }

    [SkippableFact]
    public void Normalize_extreme_page_does_not_return_negative_skip()
    {
        PagingParameters paging = new() { PageNumber = int.MaxValue, PageSize = 200 };

        (int skip, int take) = paging.Normalize();

        skip.Should().Be(int.MaxValue);
        take.Should().Be(200);
    }
}
