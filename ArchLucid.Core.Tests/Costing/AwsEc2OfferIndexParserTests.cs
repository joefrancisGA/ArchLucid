using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AwsEc2OfferIndexParserTests
{
    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_sample_offer_index()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_numeric_usd_price()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": 0.0104 }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_rejects_boolean_usd_price()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": true }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().BeNull();
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_rejects_string_encoded_boolean_usd_price()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "true" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().BeNull();
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_whitespace_padded_unit()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": " Hrs ",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_whitespace_padded_instance_type_attribute()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": " t3.micro ",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_whitespace_padded_usd_price_string()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": " 0.0104 " }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_rejects_boolean_hourly_unit_token()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": true,
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().BeNull();
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_rejects_string_encoded_on_synonym_hourly_unit()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "on",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().BeNull();
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_h_synonym_hourly_unit()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "h",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_hour_synonym_hourly_unit()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "hour",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_hr_synonym_hourly_unit()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "hr",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_usd_price_property()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "Usd": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_instance_type_attribute()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "InstanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_price_per_unit_property()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "PricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_price_dimensions_property()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "PriceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_attributes_property()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "Attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_root_offer_properties()
    {
        const string sample = """
            {
              "Products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "Terms": {
                "ondemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_mismatched_on_demand_product_key_casing()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": "t3.micro",
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "abc": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "t3.micro");

        hourly.Should().Be(0.0104m);
    }

    [Fact]
    public void TryGetLinuxOnDemandHourlyUsd_parses_numeric_instance_type_attribute()
    {
        const string sample = """
            {
              "products": {
                "ABC": {
                  "attributes": {
                    "instanceType": 12345,
                    "operatingSystem": "Linux",
                    "tenancy": "Shared",
                    "preInstalledSw": "NA"
                  }
                }
              },
              "terms": {
                "OnDemand": {
                  "ABC": {
                    "ABCTERM": {
                      "priceDimensions": {
                        "ABCDIM": {
                          "unit": "Hrs",
                          "pricePerUnit": { "USD": "0.0104" }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        decimal? hourly = AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(sample, "12345");

        hourly.Should().Be(0.0104m);
    }
}
