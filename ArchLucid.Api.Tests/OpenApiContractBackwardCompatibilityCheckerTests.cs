using System.Text.Json.Nodes;

namespace ArchLucid.Api.Tests;

/// <summary>Focused examples for semantic OpenAPI drift rules (additive vs breaking).</summary>
[Trait("Suite", "Core")]
public sealed class OpenApiContractBackwardCompatibilityCheckerTests
{
    [Fact]
    public void Additive_response_property_under_same_path_passes()
    {
        const string baseline = /*lang=json,strict*/ """
            {
              "openapi": "3.1.1",
              "info": { "title": "t", "version": "1" },
              "paths": {
                "/demo": {
                  "get": {
                    "responses": {
                      "200": {
                        "description": "ok",
                        "content": {
                          "application/json": {
                            "schema": {
                              "type": "object",
                              "properties": {
                                "alpha": { "type": "string" }
                              },
                              "required": ["alpha"]
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        const string actual = /*lang=json,strict*/ """
            {
              "openapi": "3.1.1",
              "info": { "title": "t", "version": "1" },
              "paths": {
                "/demo": {
                  "get": {
                    "responses": {
                      "200": {
                        "description": "ok",
                        "content": {
                          "application/json": {
                            "schema": {
                              "type": "object",
                              "properties": {
                                "alpha": { "type": "string" },
                                "beta": { "type": "integer" }
                              },
                              "required": ["alpha"]
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        JsonObject b = Canon(baseline);
        JsonObject a = Canon(actual);
        OpenApiContractBackwardCompatibilityChecker.ThrowIfUnreadable(b, "baseline");
        OpenApiContractBackwardCompatibilityChecker.ThrowIfUnreadable(a, "actual");
        OpenApiContractBackwardCompatibilityChecker.AssertAdditiveCompatible(b, a);
    }

    [Fact]
    public void Removed_response_property_fails()
    {
        const string baseline = /*lang=json,strict*/ """
            {
              "openapi": "3.1.1",
              "info": { "title": "t", "version": "1" },
              "paths": {
                "/demo": {
                  "get": {
                    "responses": {
                      "200": {
                        "description": "ok",
                        "content": {
                          "application/json": {
                            "schema": {
                              "type": "object",
                              "properties": {
                                "alpha": { "type": "string" },
                                "beta": { "type": "string" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        const string actual = /*lang=json,strict*/ """
            {
              "openapi": "3.1.1",
              "info": { "title": "t", "version": "1" },
              "paths": {
                "/demo": {
                  "get": {
                    "responses": {
                      "200": {
                        "description": "ok",
                        "content": {
                          "application/json": {
                            "schema": {
                              "type": "object",
                              "properties": {
                                "alpha": { "type": "string" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        JsonObject b = Canon(baseline);
        JsonObject a = Canon(actual);
        OpenApiContractBackwardCompatibilityChecker.ThrowIfUnreadable(b, "baseline");
        OpenApiContractBackwardCompatibilityChecker.ThrowIfUnreadable(a, "actual");
        _ = Assert.ThrowsAny<Exception>(() => OpenApiContractBackwardCompatibilityChecker.AssertAdditiveCompatible(b, a));
    }

    [Fact]
    public void Response_type_narrowing_fails()
    {
        const string baseline = /*lang=json,strict*/ """
            {
              "openapi": "3.1.1",
              "info": { "title": "t", "version": "1" },
              "paths": {
                "/demo": {
                  "get": {
                    "responses": {
                      "200": {
                        "description": "ok",
                        "content": {
                          "application/json": {
                            "schema": {
                              "type": ["null", "string"]
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        const string actual = /*lang=json,strict*/ """
            {
              "openapi": "3.1.1",
              "info": { "title": "t", "version": "1" },
              "paths": {
                "/demo": {
                  "get": {
                    "responses": {
                      "200": {
                        "description": "ok",
                        "content": {
                          "application/json": {
                            "schema": {
                              "type": "string"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        JsonObject b = Canon(baseline);
        JsonObject a = Canon(actual);
        OpenApiContractBackwardCompatibilityChecker.ThrowIfUnreadable(b, "baseline");
        OpenApiContractBackwardCompatibilityChecker.ThrowIfUnreadable(a, "actual");
        _ = Assert.ThrowsAny<Exception>(() => OpenApiContractBackwardCompatibilityChecker.AssertAdditiveCompatible(b, a));
    }

    static JsonObject Canon(string json)
    {
        JsonNode? n = JsonNode.Parse(json);
        Assert.NotNull(n);

        JsonNode canonical = OpenApiJsonCanonicalizer.Canonicalize(n);

        Assert.True(canonical is JsonObject, "expected object root");

        return (JsonObject)canonical;
    }
}
