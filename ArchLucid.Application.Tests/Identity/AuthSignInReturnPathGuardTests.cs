using ArchLucid.Application.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class AuthSignInReturnPathGuardTests
{
    [Theory]
    [InlineData("/reviews/1")]
    [InlineData("/")]
    [InlineData("/architecture/first-review-guide?source=bootstrap")]
    public void TryNormalize_accepts_safe_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().Be(path);
    }

    [Theory]
    [InlineData("/app/foo/../bar")]
    [InlineData("/signin/../../other")]
    [InlineData("/signin/../other?tab=settings")]
    public void TryNormalize_rejects_dot_dot_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("//evil.example")]
    [InlineData("/\\evil.example")]
    [InlineData("/redirect://evil.example")]
    [InlineData("https://evil.example/phish")]
    [InlineData("/path@evil")]
    [InlineData("reviews/1")]
    [InlineData("/%2f%2fevil.example")]
    [InlineData("/%2525252f%2525252fevil.example")]
    [InlineData("/%09//evil.example")]
    [InlineData("/%00//evil.example")]
    [InlineData("/x//evil.example")]
    [InlineData("/x%2F%2Fevil.example")]
    public void TryNormalize_rejects_open_redirect_shapes(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_deeply_encoded_embedded_protocol_relative_segment()
    {
        string payload = "//evil.example";

        for (int pass = 0; pass < 4; pass++)
        {
            payload = Uri.EscapeDataString(payload);
        }

        AuthSignInReturnPathGuard.TryNormalize($"/welcome{payload}").Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_residual_double_encoded_slashes_after_decode_cap()
    {
        string payload = "//evil.example";

        for (int pass = 0; pass < 10; pass++)
        {
            payload = Uri.EscapeDataString(payload);
        }

        AuthSignInReturnPathGuard.TryNormalize($"/welcome{payload}").Should().BeNull();
    }

    [Theory]
    [InlineData("/\uFF0F\uFF0Fevil.example")]
    [InlineData("/%EF%BC%8F%EF%BC%8Fevil.example")]
    [InlineData("/\uFF3C\uFF3Cevil.example")]
    public void TryNormalize_rejects_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u2571\u2571evil.example")]
    [InlineData("/%E2%95%B1%E2%95%B1evil.example")]
    [InlineData("/\u29F8\u29F8evil.example")]
    [InlineData("/%E2%A7%B8%E2%A7%B8evil.example")]
    [InlineData("/\u29F6\u29F6evil.example")]
    public void TryNormalize_rejects_additional_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_deeply_encoded_additional_unicode_slash_homoglyph_segment()
    {
        string payload = "\u29F8\u29F8evil.example";

        for (int pass = 0; pass < 4; pass++)
        {
            payload = Uri.EscapeDataString(payload);
        }

        AuthSignInReturnPathGuard.TryNormalize($"/welcome{payload}").Should().BeNull();
    }

    [Theory]
    [InlineData("/\uFF0E\uFF0E/admin")]
    [InlineData("/%EF%BC%8E%EF%BC%8E/admin")]
    [InlineData("/signin/\u2025/other")]
    [InlineData("/%E2%80%A5/admin")]
    [InlineData("/signin/\u2024\u2024/other")]
    public void TryNormalize_rejects_unicode_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_residual_percent_after_decode_cap()
    {
        AuthSignInReturnPathGuard.TryNormalize("/path%252525252525252525").Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/..#fragment")]
    [InlineData("/signin/..%23fragment")]
    [InlineData("/app/foo/..#bar")]
    [InlineData("/signin/..%23/evil")]
    public void TryNormalize_rejects_dot_dot_path_traversal_before_fragment_delimiter(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/reviews/1#findings")]
    [InlineData("/architecture/reviews/123?tab=findings#section")]
    public void TryNormalize_accepts_safe_relative_paths_with_fragment(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().Be(path);
    }

    [Theory]
    [InlineData("/architecture/reviews?notify=user@example.com")]
    [InlineData("/reviews/1?cc=team@contoso.com")]
    [InlineData("/reviews/1#notes@team")]
    public void TryNormalize_accepts_at_sign_in_query_or_fragment_not_path(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().Be(path);
    }

    [Theory]
    [InlineData("/user%40evil.example/phish")]
    [InlineData("/user%2540evil.example/phish")]
    public void TryNormalize_rejects_percent_encoded_at_sign_in_path_portion(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_decodes_percent_encoded_slash_in_safe_paths()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews%2F1").Should().Be("/reviews/1");
    }

    [Theory]
    [InlineData("/reviews?next=//evil.example")]
    [InlineData("/?return=//evil.example")]
    public void TryNormalize_rejects_when_query_value_contains_scheme_delimiter_substring(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u2216\u2216evil.example")]
    [InlineData("/%E2%88%96%E2%88%96evil.example")]
    [InlineData("/\u29F7\u29F7evil.example")]
    [InlineData("/%E2%A7%B7%E2%A7%B7evil.example")]
    [InlineData("/\u2AFD\u2AFDevil.example")]
    [InlineData("/%E2%AB%BD%E2%AB%BDevil.example")]
    public void TryNormalize_rejects_more_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u2572\u2572evil.example")]
    [InlineData("/%E2%95%B2%E2%95%B2evil.example")]
    [InlineData("/\u29FA\u29FAevil.example")]
    [InlineData("/%E2%A7%BA%E2%A7%BAevil.example")]
    public void TryNormalize_rejects_remaining_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\u3002\u3002/other")]
    [InlineData("/signin/%E3%80%82%E3%80%82/other")]
    [InlineData("/signin/\u06D4\u06D4/other")]
    [InlineData("/signin/\u3002\u3002#fragment")]
    public void TryNormalize_rejects_additional_unicode_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u29F9\u29F9evil.example")]
    [InlineData("/%E2%A7%B9%E2%A7%B9evil.example")]
    [InlineData("/\u29F5\u29F5evil.example")]
    [InlineData("/%E2%A7%B5%E2%A7%B5evil.example")]
    public void TryNormalize_rejects_final_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\u0387\u0387/other")]
    [InlineData("/signin/%CE%87%CE%87/other")]
    [InlineData("/signin/\u2027\u2027/other")]
    [InlineData("/signin/%E2%80%A7%E2%80%A7/other")]
    [InlineData("/signin/\u22C5\u22C5/other")]
    [InlineData("/signin/%E2%8B%85%E2%8B%85/other")]
    [InlineData("/signin/\u2219\u2219/other")]
    [InlineData("/signin/%E2%88%99%E2%88%99/other")]
    public void TryNormalize_rejects_final_unicode_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u29B8\u29B8evil.example")]
    [InlineData("/%E2%A6%B8%E2%A6%B8evil.example")]
    [InlineData("/\u29C4\u29C4evil.example")]
    [InlineData("/%E2%A7%84%E2%A7%84evil.example")]
    [InlineData("/\u29C5\u29C5evil.example")]
    [InlineData("/%E2%A7%85%E2%A7%85evil.example")]
    [InlineData("/\u2AFB\u2AFBevil.example")]
    [InlineData("/%E2%AB%BB%E2%AB%BBevil.example")]
    public void TryNormalize_rejects_named_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\u1362\u1362/other")]
    [InlineData("/signin/%E1%8D%A2%E1%8D%A2/other")]
    [InlineData("/signin/\u05C3\u05C3/other")]
    [InlineData("/signin/%D7%83%D7%83/other")]
    public void TryNormalize_rejects_script_full_stop_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u2298\u2298evil.example")]
    [InlineData("/%E2%8A%98%E2%8A%98evil.example")]
    [InlineData("/\u2E4A\u2E4Aevil.example")]
    [InlineData("/%E2%B9%8A%E2%B9%8Aevil.example")]
    [InlineData("/\u244A\u244Aevil.example")]
    [InlineData("/%E2%91%8A%E2%91%8Aevil.example")]
    [InlineData("/\u27C8\u27C8evil.example")]
    [InlineData("/%E2%9F%88%E2%9F%88evil.example")]
    [InlineData("/\u27C9\u27C9evil.example")]
    [InlineData("/%E2%9F%89%E2%9F%89evil.example")]
    public void TryNormalize_rejects_remaining_named_unicode_slash_homoglyph_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u27CB\u27CBevil.example")]
    [InlineData("/%E2%9F%8B%E2%9F%8Bevil.example")]
    [InlineData("/\u27CD\u27CDevil.example")]
    [InlineData("/%E2%9F%8D%E2%9F%8Devil.example")]
    [InlineData("/\u29F4\u29F4evil.example")]
    [InlineData("/%E2%A7%B4%E2%A7%B4evil.example")]
    public void TryNormalize_rejects_mathematical_diagonal_and_solidus_interoperator_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\u2E31\u2E31/other")]
    [InlineData("/signin/%E2%B8%B1%E2%B8%B1/other")]
    [InlineData("/signin/\u2E33\u2E33/other")]
    [InlineData("/signin/%E2%B8%B3%E2%B8%B3/other")]
    [InlineData("/signin/\u2981\u2981/other")]
    [InlineData("/signin/%E2%A6%81%E2%A6%81/other")]
    [InlineData("/signin/\u16EB\u16EB/other")]
    [InlineData("/signin/%E1%9B%AB%E1%9B%AB/other")]
    [InlineData("/signin/\u1427\u1427/other")]
    [InlineData("/signin/%E1%90%A7%E1%90%A7/other")]
    [InlineData("/signin/\u1803\u1803/other")]
    [InlineData("/signin/%E1%A0%83%E1%A0%83/other")]
    public void TryNormalize_rejects_additional_script_and_separator_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/\u2AFF\u2AFFevil.example")]
    [InlineData("/%E2%AB%BF%E2%AB%BFevil.example")]
    public void TryNormalize_rejects_double_reverse_solidus_operator_protocol_relative_paths(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\u166E\u166E/other")]
    [InlineData("/signin/%E1%99%AE%E1%99%AE/other")]
    [InlineData("/signin/\u2E30\u2E30/other")]
    [InlineData("/signin/%E2%B8%B0%E2%B8%B0/other")]
    [InlineData("/signin/\uA78F\uA78F/other")]
    [InlineData("/signin/%EA%9E%8F%EA%9E%8F/other")]
    [InlineData("/signin/\u0701\u0701/other")]
    [InlineData("/signin/%DC%81%DC%81/other")]
    [InlineData("/signin/\u0702\u0702/other")]
    [InlineData("/signin/%DC%82%DC%82/other")]
    public void TryNormalize_rejects_script_full_stop_and_ring_point_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\uFF61\uFF61/other")]
    [InlineData("/signin/%EF%BD%A1%EF%BD%A1/other")]
    [InlineData("/signin/\uFE12\uFE12/other")]
    [InlineData("/signin/%EF%B8%92%EF%B8%92/other")]
    public void TryNormalize_rejects_halfwidth_and_presentation_ideographic_full_stop_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/\uFE30/other")]
    [InlineData("/signin/%EF%B8%B0/other")]
    [InlineData("/signin/\u30FB\u30FB/other")]
    [InlineData("/signin/%E3%83%BB%E3%83%BB/other")]
    [InlineData("/signin/\uFF65\uFF65/other")]
    [InlineData("/signin/%EF%BD%A5%EF%BD%A5/other")]
    public void TryNormalize_rejects_presentation_two_dot_leader_and_katakana_middle_dot_homoglyph_path_traversal_segments(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/user\uFF20evil.example/phish")]
    [InlineData("/user\uFE6Bevil.example/phish")]
    [InlineData("/user%EF%BC%A0evil.example/phish")]
    [InlineData("/user%EF%B9%ABevil.example/phish")]
    public void TryNormalize_rejects_fullwidth_commercial_at_userinfo_homoglyphs(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/reviews#//evil")]
    [InlineData("/reviews#foo://bar")]
    public void TryNormalize_rejects_when_fragment_contains_open_redirect_substrings(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_accepts_safe_path_preserving_query_without_open_redirect_substrings()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews?tab=open").Should().Be("/reviews?tab=open");
    }

    [Fact]
    public void TryNormalize_decodes_percent_encoded_slash_in_query_portion_without_path_traversal_checks()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews?x=%2F").Should().Be("/reviews?x=/");
    }

    [Fact]
    public void TryNormalize_accepts_plus_in_path_without_form_style_space_decoding()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews+api").Should().Be("/reviews+api");
    }

    [Fact]
    public void TryNormalize_accepts_matrix_style_semicolon_segments_when_no_open_redirect_shape()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews;region=east").Should().Be("/reviews;region=east");
    }

    [Fact]
    public void TryNormalize_rejects_matrix_style_path_when_protocol_relative_slashes_appear_in_segment()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews;next=//evil.example").Should().BeNull();
    }

    [Theory]
    [InlineData("/signin/%2E%2E/other")]
    [InlineData("/signin/%2e%2e/other")]
    public void TryNormalize_rejects_percent_encoded_dot_dot_segments_case_insensitively(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_completes_for_large_multi_pass_percent_encoded_safe_path()
    {
        string segment = string.Concat(Enumerable.Repeat("%252541", 12_000));
        string path = "/reviews/" + segment;

        string? normalized = AuthSignInReturnPathGuard.TryNormalize(path);

        normalized.Should().NotBeNull();
        normalized.Should().StartWith("/reviews/");
        normalized!.Length.Should().BeLessThan(path.Length);
    }

    [Theory]
    [InlineData("/reviews?label=\uFF0F")]
    [InlineData("/reviews?path=\u2215segment")]
    public void TryNormalize_rejects_when_query_contains_slash_homoglyph_conservative_full_string_scan(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/reviews?dots=\uFF0E\uFF0E")]
    [InlineData("/reviews?dots=\u3002\u3002")]
    public void TryNormalize_rejects_when_query_contains_dot_homoglyph_conservative_full_string_scan(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/reviews?x=%09")]
    [InlineData("/reviews?x=%0A")]
    public void TryNormalize_rejects_when_decoded_query_contains_control_character(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_accepts_nbsp_inside_path_segment_without_open_redirect_shape()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews\u00A0active").Should().Be("/reviews\u00A0active");
    }

    [Fact]
    public void TryNormalize_rejects_when_query_retains_percent_after_decode_cap()
    {
        string queryValue = string.Concat(Enumerable.Repeat("%25", 9));
        AuthSignInReturnPathGuard.TryNormalize("/reviews?x=" + queryValue).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_when_leading_byte_order_mark_precedes_slash()
    {
        AuthSignInReturnPathGuard.TryNormalize("\uFEFF/reviews").Should().BeNull();
    }

    [Theory]
    [InlineData("/reviews#campaign=\uFF0F")]
    [InlineData("/reviews#path=\u2215tail")]
    public void TryNormalize_rejects_when_fragment_contains_slash_homoglyph_conservative_full_string_scan(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Theory]
    [InlineData("/reviews#label=\uFF0E\uFF0E")]
    [InlineData("/reviews#dots=\u3002\u3002")]
    public void TryNormalize_rejects_when_fragment_contains_dot_homoglyph_conservative_full_string_scan(string path)
    {
        AuthSignInReturnPathGuard.TryNormalize(path).Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_percent_encoded_del_control_character_in_path_segment()
    {
        AuthSignInReturnPathGuard.TryNormalize("/reviews/%7Fsegment").Should().BeNull();
    }

    [Fact]
    public void TryNormalize_rejects_when_fragment_decodes_to_slash_homoglyph_after_percent_decode()
    {
        AuthSignInReturnPathGuard.TryNormalize("/safe#%EF%BC%8F").Should().BeNull();
    }
}
