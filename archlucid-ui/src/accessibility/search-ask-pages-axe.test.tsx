import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import AskPage from "@/app/(operator)/insights/ask-review-questions/page";
import SearchPage from "@/app/(operator)/insights/search-review-evidence/page";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: (): string => "/insights/ask-review-questions",
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
  useRouter: (): { push: () => void; replace: () => void } => ({
    push: () => {},
    replace: () => {},
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/conversation-api", () => ({
  askArchLucid: vi.fn(),
  getConversationMessages: vi.fn().mockResolvedValue([]),
  listConversationThreads: vi.fn().mockResolvedValue([]),
}));

expect.extend(toHaveNoViolations);

describe("search + ask operator pages — axe (Vitest)", () => {
  it(
    "SearchPage has no serious axe violations",
    async () => {
      const page = await SearchPage();
      const { container } = render(page);

      expect(await axe(container)).toHaveNoViolations();
    },
    20_000,
  );

  it(
    "AskPage has no serious axe violations",
    async () => {
      const { container } = render(<AskPage />);

      expect(await axe(container)).toHaveNoViolations();
    },
    20_000,
  );
});
