using System.Net;
using System.Net.Http;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GcpCloudBillingCatalogClientTests
{
    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_string_encoded_unit_price_tokens()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0",
                              "nanos": "10400000"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_numeric_unit_price_tokens()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_whole_number_double_unit_price_tokens()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0.0,
                              "nanos": 10400000.0
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_whitespace_padded_usage_unit()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": " h ",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_hrs_synonym_hourly_usage_unit()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "Hrs",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_hour_synonym_hourly_usage_unit()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "hour",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_hr_synonym_hourly_usage_unit()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "hr",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_boolean_unit_price_tokens()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": true
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(0m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_string_encoded_whole_number_double_nanos()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0",
                              "nanos": "10400000.0"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_rejects_string_encoded_boolean_nanos()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": "true"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().BeNull();
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_string_encoded_whole_number_double_units()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0.0",
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_whitespace_padded_description()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": " Compute Engine n1-standard-1 in us-central1 ",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_boolean_hourly_usage_unit_token()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": true,
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_rejects_string_encoded_on_synonym_hourly_usage_unit()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "on",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().BeNull();
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_usage_unit_property()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "UsageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_description_property()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "Description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_tiered_rate_properties()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "TieredRates": [
                          {
                            "UnitPrice": {
                              "Units": 0,
                              "Nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_pricing_info_property()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "PricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_skus_root_property()
    {
        const string catalogJson = """
            {
              "Skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_unit_price_with_omitted_zero_units()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_unit_price_with_omitted_zero_nanos()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 1
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(730.00m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_uses_later_hourly_pricing_info_entry()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "mo",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 50,
                              "nanos": 0
                            }
                          }
                        ]
                      }
                    },
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_uses_later_paid_tiered_rate_entry()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 0
                            }
                          },
                          {
                            "unitPrice": {
                              "units": 0,
                              "nanos": 10400000
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_prefers_exact_machine_type_over_prefix_collision()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-10 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0",
                              "nanos": "50000000"
                            }
                          }
                        ]
                      }
                    }
                  ]
                },
                {
                  "description": "Compute Engine n1-standard-1 in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0",
                              "nanos": "10400000"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().Be(7.59m);
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_rejects_letter_suffix_machine_type_collision()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine n1-standard-1d in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0",
                              "nanos": "50000000"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("n1-standard-1", 1, CancellationToken.None);

        monthly.Should().BeNull();
    }

    [Fact]
    public async Task TryGetComputeEngineMonthlyUsdAsync_rejects_letter_prefix_machine_type_collision()
    {
        const string catalogJson = """
            {
              "skus": [
                {
                  "description": "Compute Engine ve2-micro in us-central1",
                  "pricingInfo": [
                    {
                      "pricingExpression": {
                        "usageUnit": "h",
                        "tieredRates": [
                          {
                            "unitPrice": {
                              "units": "0",
                              "nanos": "50000000"
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
            """;

        GcpCloudBillingCatalogClient client = CreateClient(catalogJson);

        decimal? monthly = await client.TryGetComputeEngineMonthlyUsdAsync("e2-micro", 1, CancellationToken.None);

        monthly.Should().BeNull();
    }

    private static GcpCloudBillingCatalogClient CreateClient(string catalogJson)
    {
        HttpClient httpClient = new(new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(catalogJson),
            }));

        return new GcpCloudBillingCatalogClient(
            () => httpClient,
            new StubOptionsMonitor<GcpBillingCatalogOptions>(new GcpBillingCatalogOptions { ApiKey = "test-key" }),
            TimeProvider.System,
            NullLogger<GcpCloudBillingCatalogClient>.Instance);
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder =
            responder ?? throw new ArgumentNullException(nameof(responder));

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(_responder(request));
    }

    private sealed class StubOptionsMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue { get; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
