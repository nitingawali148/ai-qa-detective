import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver — recharts' ResponsiveContainer needs it.
if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error — minimal stub, not a full ResizeObserver implementation
  window.ResizeObserver = ResizeObserverStub;
}

// jsdom doesn't implement matchMedia — ThemeToggle reads it to pick an initial theme.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
