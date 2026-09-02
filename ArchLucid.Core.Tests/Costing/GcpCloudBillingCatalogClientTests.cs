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
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_string_encoded_boolean_nanos()
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

        monthly.Should().Be(0m);
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
    public async Task TryGetComputeEngineMonthlyUsdAsync_parses_string_encoded_on_synonym_hourly_usage_unit()
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

        monthly.Should().Be(7.59m);
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
