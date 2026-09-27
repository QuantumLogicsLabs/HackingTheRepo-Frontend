import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import api, { USER_KEY } from "../utils/api";

vi.mock("../utils/api", async () => {
  const actual = await vi.importActual<typeof import("../utils/api")>("../utils/api");
  return {
    ...actual,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: "/api", headers: { common: {} } },
      interceptors: actual.default.interceptors,
    },
  };
});

vi.mock("../utils/metrics", () => ({ sendMetricEvent: vi.fn() }));

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    // No token seeding needed — AuthContext now establishes the session by
    // calling GET /auth/me on mount (mocked below), matching the real
    // cookie-based flow where the browser sends the httpOnly cookie itself.
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: "1", username: "alice", email: "a@example.com" }),
    );
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === "/auth/me") {
        return Promise.resolve({
          data: { id: "1", username: "alice", email: "a@example.com" },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("shows empty state", async () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("No jobs yet")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("renders job list", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === "/auth/me") {
        return Promise.resolve({
          data: { id: "1", username: "alice", email: "a@example.com" },
        });
      }
      return Promise.resolve({
        data: [
          {
            _id: "j1",
            repoUrl: "https://github.com/a/b",
            instruction: "add tests",
            branchName: "repomind/x",
            status: "completed",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    });

    render(
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByText(/add tests/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("filters and sorts jobs", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === "/auth/me") {
        return Promise.resolve({
          data: { id: "1", username: "alice", email: "a@example.com" },
        });
      }
      return Promise.resolve({
        data: [
          {
            _id: "j1",
            repoUrl: "https://github.com/a/api",
            instruction: "add api tests",
            branchName: "repomind/api-tests",
            status: "completed",
            createdAt: "2026-09-15T10:00:00.000Z",
          },
          {
            _id: "j2",
            repoUrl: "https://github.com/a/web",
            instruction: "fix login",
            branchName: "repomind/login",
            status: "running",
            createdAt: "2026-09-15T11:00:00.000Z",
          },
          {
            _id: "j3",
            repoUrl: "https://github.com/a/docs",
            instruction: "update docs",
            branchName: "repomind/docs",
            status: "failed",
            createdAt: "2026-09-15T09:00:00.000Z",
          },
        ],
      });
    });

    render(
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByText(/add api tests/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await userEvent.type(screen.getByLabelText(/search jobs/i), "docs");
    expect(screen.getByText(/update docs/i)).toBeInTheDocument();
    expect(screen.queryByText(/add api tests/i)).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/search jobs/i));
    await userEvent.selectOptions(screen.getByLabelText(/status/i), "running");
    expect(screen.getByText(/fix login/i)).toBeInTheDocument();
    expect(screen.queryByText(/update docs/i)).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/status/i), "all");
    await userEvent.selectOptions(
      screen.getByLabelText(/sort/i),
      "running-first",
    );

    const runningJob = screen.getByText(/fix login/i);
    const completedJob = screen.getByText(/add api tests/i);
    expect(
      runningJob.compareDocumentPosition(completedJob) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
