import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const pendingInvitationCountMock = vi.hoisted(() => ({ value: 0 }));

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/administration/users",
  useRouter: (): { push: () => void; replace: typeof replaceMock; refresh: () => void } => ({
    push: vi.fn(),
    replace: replaceMock,
    refresh: vi.fn(),
  }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/api-keys-settings-access", () => ({
  isApiKeysSettingsSurfaceEnabled: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Admin User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: 3,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/ApiKeysUsersVocabularyRail", () => ({
  ApiKeysUsersVocabularyRail: () => <div data-testid="api-keys-users-vocabulary-rail" />,
}));

vi.mock("@/components/ScimUsersVocabularyRail", () => ({
  ScimUsersVocabularyRail: () => <div data-testid="scim-users-vocabulary-rail" />,
}));

vi.mock("@/components/CustomRolesUsersVocabularyRail", () => ({
  CustomRolesUsersVocabularyRail: () => <div data-testid="custom-roles-users-vocabulary-rail" />,
}));

vi.mock("./SettingsRolesInvitePanel", () => ({
  SettingsRolesInvitePanel: () => <div data-testid="settings-roles-invite-form" />,
}));

vi.mock("./PendingInvitationsPanel", () => ({
  PendingInvitationsPanel: ({
    onCountChange,
  }: {
    onCountChange?: (count: number | null) => void;
  }) => {
    onCountChange?.(pendingInvitationCountMock.value);

    return <div data-testid="settings-roles-pending-invitations-table" />;
  },
}));

vi.mock("./SettingsRolesMatrixSection", () => ({
  SettingsRolesMatrixSection: () => <div data-testid="settings-roles-matrix-section" />,
}));

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  SETTINGS_ROLES_SETTINGS_CLAIM_DISCIPLINE,
  SETTINGS_ROLES_SETTINGS_FOLLOW_UPS_TITLE,
  SETTINGS_ROLES_SETTINGS_SOURCES,
} from "@/lib/settings-roles-settings-evidence-copy";
import {
  SETTINGS_ROLES_PAGE_SUBTITLE_BUYER,
  SETTINGS_ROLES_PAGE_SUBTITLE_OPERATOR,
  SETTINGS_ROLES_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  SETTINGS_ROLES_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SETTINGS_ROLES_SETTINGS_PRIMARY_CONTENT_ID,
  SETTINGS_ROLES_SETTINGS_SKIP_LINK_LABEL,
  SETTINGS_ROLES_SETTINGS_SKIP_TARGET_ID,
} from "./settings-roles-settings-page-copy";
import { SettingsRolesPageView } from "./SettingsRolesPageView";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function buildModel(overrides: Partial<SettingsRolesPageViewModel> = {}): SettingsRolesPageViewModel {
  return {
    surface: "admin",
    loading: false,
    sortedRows: [],
    usersNote: null,
    keysNote: null,
    usersDirectorySource: null,
    load: vi.fn(async () => undefined),
    onRoleChange: vi.fn(async () => "saved" as const),
    ...overrides,
  };
}

describe("SettingsRolesPageView buyer-polished shell (AUX)", () => {
  it("renders skip link, start-here panel before follow-ups, header claim discipline, and hides operator chrome", () => {
    render(<SettingsRolesPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: SETTINGS_ROLES_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SETTINGS_ROLES_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SETTINGS_ROLES_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SETTINGS_ROLES_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId(SETTINGS_ROLES_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SETTINGS_ROLES_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("settings-roles-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("api-keys-users-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scim-users-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("custom-roles-users-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SETTINGS_ROLES_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-settings-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(SETTINGS_ROLES_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SETTINGS_ROLES_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("settings-roles-action-panel");
    const orientationBottom = screen.getByTestId("settings-roles-orientation-bottom");
    const sourcesSection = screen.getByTestId("settings-roles-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(actionPanel);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("settings-roles-page-title")).toHaveTextContent(
      OPERATOR_NAV_LINK_LABELS.usersAndRoles,
    );
    expect(screen.getByTestId("settings-roles-start-here-invite")).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(SETTINGS_ROLES_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
