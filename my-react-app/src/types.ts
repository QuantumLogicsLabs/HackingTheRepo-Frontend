export type JobStatus = "queued" | "running" | "completed" | "failed" | "refined";

export interface AuthUser {
  id?: string;
  username: string;
  email: string;
  totalJobs?: number;
  successfulPRs?: number;
}

export interface LocalUser extends AuthUser {
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser | null;
}

export interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export interface JobRefinement {
  instruction: string;
  timestamp: string;
}

export interface Job {
  _id: string;
  repoUrl: string;
  instruction: string;
  branchName: string;
  prTitle?: string;
  prUrl?: string;
  status: JobStatus | string;
  createdAt: string;
  repomindJobId?: string;
  diffSummary?: string;
  errorMessage?: string;
  refinements?: JobRefinement[];
}

export interface Settings {
  githubUsername: string;
  githubToken: string;
  openaiKey: string;
  hasGithubToken: boolean;
  hasOpenaiKey: boolean;
}
