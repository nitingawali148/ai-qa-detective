import { describe, it, expect, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import { renderWithProviders } from "../test/renderWithProviders";
import { mockFetch } from "../test/mockFetch";
import { DASHBOARD_MOCK, HEALTH_MOCK } from "../test/fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("Dashboard", () => {
  it("loads and displays key metrics", async () => {
    mockFetch({ "/dashboard": DASHBOARD_MOCK, "/health": HEALTH_MOCK });

    renderWithProviders(<Dashboard />);

    expect(await screen.findByRole("heading", { name: "AI QA Detective" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("150")).toBeInTheDocument());
    expect(screen.getByText("12")).toBeInTheDocument(); // failed tests
    expect(screen.getByText("Tests Analyzed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Release Risk" })).toBeInTheDocument();
  });

  it("shows an error message when the dashboard request fails", async () => {
    mockFetch({}); // no routes registered → 404 for everything
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText(/failed with status 404/i)).toBeInTheDocument();
  });
});
