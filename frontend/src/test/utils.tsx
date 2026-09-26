import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { makeStore } from "../store";
import type { User } from "../services/types";

export const testUser: User = { id: "u1", name: "Asha Rao", email: "asha@example.com", preferredLanguage: "en", timezone: "Asia/Kolkata" };

export function renderWithProviders(ui: ReactElement, opts: { route?: string; signedIn?: boolean; preloaded?: Parameters<typeof makeStore>[0] } = {}) {
  const store = makeStore({
    ...(opts.signedIn ? { auth: { user: testUser, status: "ready" as const, error: null } } : {}),
    ...opts.preloaded,
  });
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[opts.route ?? "/"]}>{ui}</MemoryRouter>
    </Provider>,
  );
  return { store, ...utils };
}
