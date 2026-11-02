using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class ArmPercentDecoderTests
{
    [Fact]
    public void PercentDecodeRepeatedly_decodes_multilayer_percent_encoded_value()
    {
        const string encoded = "a%25252Fb";

        ArmPercentDecoder.PercentDecodeRepeatedly(encoded).Should().Be("a/b");
    }

    [Fact]
    public void PercentDecodeRepeatedly_leaves_plain_value_untouched()
    {
        const string armId = "/subscriptions/abc/resourceGroups/rg";

        ArmPercentDecoder.PercentDecodeRepeatedly(armId).Should().Be(armId);
    }

    [Fact]
    public void PercentDecodeRepeatedly_leaves_malformed_escapes_unchanged()
    {
        const string malformed = "/subscriptions/a%ZZb%";

        ArmPercentDecoder.PercentDecodeRepeatedly(malformed).Should().Be(malformed);
    }

    [Fact]
    public void PercentDecodeRepeatedly_stops_after_max_passes()
    {
        string deeplyEncoded = "x";

        for (int layer = 0; layer < ArmPercentDecoder.DefaultMaxPasses + 2; layer++)
        {
            deeplyEncoded = Uri.EscapeDataString(deeplyEncoded);
        }

        ArmPercentDecoder.PercentDecodeRepeatedly(deeplyEncoded)
            .Should()
            .Be(Uri.EscapeDataString(Uri.EscapeDataString("x")));
    }

    [Fact]
    public void PercentDecodeRepeatedly_honours_caller_supplied_max_passes()
    {
        const string encoded = "a%252Fb";

        ArmPercentDecoder.PercentDecodeRepeatedly(encoded, maxPasses: 1).Should().Be("a%2Fb");
        ArmPercentDecoder.PercentDecodeRepeatedly(encoded, maxPasses: 2).Should().Be("a/b");
    }
}
