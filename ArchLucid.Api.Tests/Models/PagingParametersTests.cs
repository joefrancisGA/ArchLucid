using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Models;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PagingParametersTests
{
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
}
