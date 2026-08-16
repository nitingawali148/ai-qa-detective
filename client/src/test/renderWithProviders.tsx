import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AnalysisProvider } from "../context/AnalysisContext";

export function renderWithProviders(ui: ReactElement, initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AnalysisProvider>{ui}</AnalysisProvider>
    </MemoryRouter>
  );
}
