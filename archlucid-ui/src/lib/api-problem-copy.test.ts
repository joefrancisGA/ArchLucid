import { describe, expect, it } from "vitest";

import type { ApiProblemDetails } from "./api-problem";
import { operatorCopyForProblem } from "./api-problem-copy";

describe("operatorCopyForProblem", () => {
  it("uses fallback when problem is null", () => {
    const copy = operatorCopyForProblem(null, "Network down");

    expect(copy).toEqual({
      heading: "Request failed",
      body: "Network down",
    });
  });

  it("trims fallback and uses default when empty", () => {
    const copy = operatorCopyForProblem(null, "   ");

    expect(copy.body).toBe("Request failed.");
  });

  it("maps known errorCode to heading", () => {
    const problem: ApiProblemDetails = {
      errorCode: "RUN_NOT_FOUND",
      title: "Not Found",
      detail: "No such run",
    };

    const copy = operatorCopyForProblem(problem, "fallback");

    expect(copy.heading).toBe("Review not found");
    expect(copy.body).toBe("No such run");
  });

  it("uses title as heading when errorCode unknown", () => {
    const problem: ApiProblemDetails = { title: "Custom", detail: "D" };

    expect(operatorCopyForProblem(problem, "f")).toMatchObject({
      heading: "Custom",
      body: "D",
    });
  });

  it("includes supportHint when present", () => {
    const problem: ApiProblemDetails = {
      title: "T",
      detail: "D",
      supportHint: "Try again later",
    };

    expect(operatorCopyForProblem(problem, "f")).toEqual({
      heading: "T",
      body: "D",
      hint: "Try again later",
    });
  });

  it("uses title as body when detail missing", () => {
    const problem: ApiProblemDetails = { title: "Only title" };

    expect(operatorCopyForProblem(problem, "fallback")).toMatchObject({
      body: "Only title",
    });
  });

  it("falls back to fallbackMessage when problem lacks title and detail", () => {
    const problem: ApiProblemDetails = { errorCode: "INTERNAL_ERROR" };

    const copy = operatorCopyForProblem(problem, "Use this");

    expect(copy.body).toBe("Use this");
  });

  it("uses rate limit heading and Retry-After hint when httpStatus is 429", () => {
    const problem: ApiProblemDetails = { title: "Throttled", detail: "Quota exceeded" };

    const copy = operatorCopyForProblem(problem, "fallback", {
      httpStatus: 429,
      retryAfterSeconds: 30,
    });

    expect(copy.heading).toBe("Too many requests");
    expect(copy.body).toBe("Quota exceeded");
    expect(copy.hint).toContain("30 seconds");
  });

  it("uses auth headings when problem is null and httpStatus is 401 or 403", () => {
    const unauthorized = operatorCopyForProblem(null, "Bearer rejected", { httpStatus: 401 });

    expect(unauthorized.heading).toBe("Sign-in required");
    expect(unauthorized.hint).toContain("Sign in again");

    const forbidden = operatorCopyForProblem(null, "Not allowed", { httpStatus: 403 });

    expect(forbidden.heading).toBe("Not permitted");
    expect(forbidden.hint).toContain("administrator");
  });

  it("includes remediation for graph resolution failures by errorCode", () => {
    const problem: ApiProblemDetails = {
      errorCode: "GRAPH_RESOLUTION_FAILED",
      title: "Graph error",
      detail: "Could not load edges",
    };

    const copy = operatorCopyForProblem(problem, "fallback");

    expect(copy.heading).toBe("Graph could not be built");
    expect(copy.hint).toContain("ingestion");
  });

  it("maps quality gate, proof, and config lint hold codes to actionable hints", () => {
    const qualityGate = operatorCopyForProblem(
      { errorCode: "QUALITY_GATE_REJECTED", title: "Conflict", detail: "Rejected" },
      "fallback",
    );
    expect(qualityGate.heading).toBe("Quality gate rejected");
    expect(qualityGate.hint).toContain("QUALITY_GATE_REJECTION.md");

    const proofHold = operatorCopyForProblem(
      { errorCode: "PROOF_PACKET_HOLD", title: "Hold", detail: "Blocked" },
      "fallback",
    );
    expect(proofHold.hint).toContain("collect-first-pilot-proof");

    const configLint = operatorCopyForProblem(
      { errorCode: "CONFIG_LINT_HOLD", title: "Hold", detail: "Blocked" },
      "fallback",
    );
    expect(configLint.hint).toContain("config lint");
  });

  it("uses trial heading when httpStatus is 402", () => {
    const copy = operatorCopyForProblem(null, "Payment required", { httpStatus: 402 });

    expect(copy.heading).toBe("Trial or billing limit");
    expect(copy.hint).toContain("trial");
  });
});
