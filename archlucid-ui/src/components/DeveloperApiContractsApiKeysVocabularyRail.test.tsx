import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import {
  DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE,
  DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_HEADING,
  DEVELOPER_API_CONTRACTS_API_KEYS_WHY_THREE,
} from "@/lib/developer-api-contracts-api-keys-vocabulary";

describe("DeveloperApiContractsApiKeysVocabularyRail (TB-2270)", () => {
  it("renders developer strip with peer links to contracts and keys", () => {
    render(<DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="developer" />);

    const strip = screen.getByTestId("developer-api-contracts-api-keys-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "developer");
    expect(strip.textContent ?? "").toContain(DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE);

    const contractsPeer = screen.getByTestId(
      "developer-api-contracts-api-keys-vocabulary-peer-api-contracts",
    );
    expect(contractsPeer).toHaveTextContent(DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK.label);
    expect(contractsPeer).toHaveAttribute(
      "href",
      DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK.href,
    );

    const keysPeer = screen.getByTestId(
      "developer-api-contracts-api-keys-vocabulary-peer-api-keys",
    );
    expect(keysPeer).toHaveTextContent(DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK.label);
    expect(keysPeer).toHaveAttribute("href", DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK.href);
  });

  it("renders api-keys strip with peer links to developer and contracts", () => {
    render(<DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="api-keys" />);

    expect(screen.getByTestId("developer-api-contracts-api-keys-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "api-keys",
    );

    const developerPeer = screen.getByTestId(
      "developer-api-contracts-api-keys-vocabulary-peer-developer",
    );
    expect(developerPeer).toHaveTextContent(DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK.label);
    expect(developerPeer).toHaveAttribute("href", DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK.href);
  });

  it("renders full variant with why-three and triad cards", () => {
    render(
      <DeveloperApiContractsApiKeysVocabularyRail
        currentSurfaceId="api-contracts"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("developer-api-contracts-api-keys-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(DEVELOPER_API_CONTRACTS_API_KEYS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DEVELOPER_API_CONTRACTS_API_KEYS_WHY_THREE)).toBeInTheDocument();
    expect(
      screen.getByTestId("developer-api-contracts-api-keys-vocabulary-job-developer"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("developer-api-contracts-api-keys-vocabulary-job-api-contracts"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("developer-api-contracts-api-keys-vocabulary-job-api-keys"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("developer-api-contracts-api-keys-vocabulary-current"),
    ).toHaveTextContent(DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK.label);
  });
});
