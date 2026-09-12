import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { allocateMermaidRenderId, renderMermaidSvgMarkup, resetMermaidSafeRenderQueue } from "@/lib/mermaid/mermaid-safe-render";

const renderMock = vi.fn();
const initializeMock = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

describe("mermaid-safe-render", () => {
  beforeEach(() => {
    resetMermaidSafeRenderQueue();
    renderMock.mockReset();
    initializeMock.mockReset();
    renderMock.mockResolvedValue({ svg: "<svg id='ok'></svg>" });
  });

  afterEach(() => {
    resetMermaidSafeRenderQueue();
  });

  it("allocates distinct sanitized ids for successive renders", () => {
    expect(allocateMermaidRenderId(":r1:arch-diagram")).toBe("r1arch-diagram-1");
    expect(allocateMermaidRenderId(":r1:arch-diagram")).toBe("r1arch-diagram-2");
  });

  it("strips inline flowchart comments before mermaid.render", async () => {
    await renderMermaidSvgMarkup('flowchart TD\n  n1["vnet-aep"] %% al-type=microsoft.network/virtualnetworks', {
      renderIdBase: "arch-diagram-r1",
      initialize: (mermaid) => {
        mermaid.initialize({ startOnLoad: false });
      },
    });

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock.mock.calls[0]?.[1]).toBe('flowchart TD\n  n1["vnet-aep"]');
  });

  it("serializes overlapping renders onto distinct ids", async () => {
    let releaseFirst: ((value: { svg: string }) => void) | undefined;
    const firstGate = new Promise<{ svg: string }>((resolve) => {
      releaseFirst = resolve;
    });

    renderMock.mockImplementationOnce(() => firstGate).mockResolvedValueOnce({ svg: "<svg id='second'></svg>" });

    const first = renderMermaidSvgMarkup("flowchart TD\n  A-->B", {
      renderIdBase: "arch-diagram-r1",
      initialize: (mermaid) => {
        mermaid.initialize({ startOnLoad: false });
      },
    });
    const second = renderMermaidSvgMarkup("flowchart TD\n  C-->D", {
      renderIdBase: "arch-diagram-r1",
      initialize: (mermaid) => {
        mermaid.initialize({ startOnLoad: false });
      },
    });

    await vi.waitFor(() => {
      expect(renderMock).toHaveBeenCalledTimes(1);
    });

    expect(releaseFirst).toBeDefined();
    releaseFirst?.({ svg: "<svg id='first'></svg>" });

    const [firstSvg, secondSvg] = await Promise.all([first, second]);

    expect(firstSvg).toContain("first");
    expect(secondSvg).toContain("second");
    expect(renderMock.mock.calls[0]?.[0]).not.toBe(renderMock.mock.calls[1]?.[0]);
    expect(renderMock.mock.calls[0]?.[0]).toMatch(/^arch-diagram-r1-/);
    expect(renderMock.mock.calls[1]?.[0]).toMatch(/^arch-diagram-r1-/);
  });

  it("cleans mermaid scratch nodes after a firstChild crash", async () => {
    const bind = document.createElement("div");
    bind.id = "darch-diagram-r1-1";
    document.body.appendChild(bind);
    renderMock.mockRejectedValueOnce(new Error("Cannot read properties of null (reading 'firstChild')"));

    await expect(
      renderMermaidSvgMarkup("flowchart TD\n  A-->B", {
        renderIdBase: "arch-diagram-r1",
        initialize: (mermaid) => {
          mermaid.initialize({ startOnLoad: false });
        },
      }),
    ).rejects.toThrow(/firstChild/);

    expect(document.getElementById("darch-diagram-r1-1")).toBeNull();
  });
});
