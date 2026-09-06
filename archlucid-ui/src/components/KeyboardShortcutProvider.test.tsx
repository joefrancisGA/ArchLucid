import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveShortcutDescription, SHORTCUTS } from "@/lib/shortcut-registry";

const { routerPush, workspaceModeMocks } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  workspaceModeMocks: {
    mode: "guided" as const,
    isWorkingMode: false,
  },
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMocks.mode,
    isWorkingMode: workspaceModeMocks.isWorkingMode,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    title,
    className,
  }: {
    href: string;
    children: import("react").ReactNode;
    title?: string;
    className?: string;
  }) => (
    <a href={href} title={title} className={className}>
      {children}
    </a>
  ),
}));

import { KeyboardShortcutProvider } from "./KeyboardShortcutProvider";

describe("KeyboardShortcutProvider", () => {
  beforeEach(() => {
    routerPush.mockClear();
    workspaceModeMocks.mode = "guided";
    workspaceModeMocks.isWorkingMode = false;
  });

  it("renders children without visible shortcut help UI by default", () => {
    render(
      <KeyboardShortcutProvider>
        <div data-testid="child">Shell content</div>
      </KeyboardShortcutProvider>,
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Shell content");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Keyboard shortcuts")).not.toBeInTheDocument();
  });

  it("opens help dialog on Shift+? with heading and command palette shortcuts", () => {
    render(
      <KeyboardShortcutProvider>
        <span>app</span>
      </KeyboardShortcutProvider>,
    );

    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keyboard shortcuts" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Command palette" })).toBeInTheDocument();
    expect(
      screen.getByText(resolveShortcutDescription(SHORTCUTS[0], workspaceModeMocks.isWorkingMode)),
    ).toBeInTheDocument();
  });

  it("closes the dialog on Escape", () => {
    render(
      <KeyboardShortcutProvider>
        <span>app</span>
      </KeyboardShortcutProvider>,
    );

    fireEvent.keyDown(window, { key: "?", shiftKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("describes desk work before navigation in Working mode (PC-11)", () => {
    workspaceModeMocks.mode = "working";
    workspaceModeMocks.isWorkingMode = true;

    render(
      <KeyboardShortcutProvider>
        <span>app</span>
      </KeyboardShortcutProvider>,
    );

    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    expect(screen.getByText(/Desk work shortcuts are listed first/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Desk work (Working)" })).toBeInTheDocument();
  });
});
