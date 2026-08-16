import { describe, it, expect, afterEach, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { AnalyzeFailure } from "./AnalyzeFailure";
import { renderWithProviders } from "../test/renderWithProviders";
import { mockFetch } from "../test/mockFetch";
import { ANALYZE_RESPONSE_MOCK, DEFECT_MOCK, DEMO_SCENARIO_MOCK, HEALTH_MOCK } from "../test/fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("AnalyzeFailure page", () => {
  it("renders the test information and evidence form", () => {
    mockFetch({ "/health": HEALTH_MOCK });
    renderWithProviders(<AnalyzeFailure />);

    expect(screen.getByText("Test Information")).toBeInTheDocument();
    expect(screen.getByText("Test Details")).toBeInTheDocument();
    expect(screen.getByText("Failure Evidence")).toBeInTheDocument();
    expect(screen.getByText("Load Demo Failure")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Analyze with AI/i })).toBeInTheDocument();
  });

  it("loads the demo failure into the form", async () => {
    mockFetch({ "/health": HEALTH_MOCK, "/demo/scenarios": { scenarios: [] }, "/demo": DEMO_SCENARIO_MOCK });
    renderWithProviders(<AnalyzeFailure />);

    fireEvent.click(screen.getByText("Load Demo Failure"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Verify successful checkout using credit card")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("ShopSphere E-Commerce")).toBeInTheDocument();
  });

  it("analyzes the demo failure and renders the AI results", async () => {
    mockFetch({
      "/health": HEALTH_MOCK,
      "/demo/scenarios": { scenarios: [] },
      "/demo": DEMO_SCENARIO_MOCK,
      "/analyze": ANALYZE_RESPONSE_MOCK,
      "/defect": { defect: DEFECT_MOCK },
    });
    renderWithProviders(<AnalyzeFailure />);

    fireEvent.click(screen.getByText("Load Demo Failure"));
    await waitFor(() => expect(screen.getByDisplayValue("ShopSphere E-Commerce")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Analyze with AI/i }));

    await waitFor(
      () => expect(screen.getByText(ANALYZE_RESPONSE_MOCK.analysis.root_cause)).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("Generate Regression Tests", { exact: false })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate Defect/i }));

    await waitFor(() => expect(screen.getByText(DEFECT_MOCK.title)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Create Jira Defect/i })).toBeInTheDocument();
  });
});
