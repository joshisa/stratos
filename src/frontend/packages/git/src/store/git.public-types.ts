
export const FETCH_BRANCHES_FOR_PROJECT = '[Deploy App] Fetch branches';
export const FETCH_BRANCH_FOR_PROJECT = '[Deploy App] Fetch branch';
export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export const FETCH_COMMIT = '[Deploy App] Fetch commit';
export const FETCH_COMMITS = '[Deploy App] Fetch commits';

export const FETCH_BRANCH_START = '[GitHub] Fetch branch start';
export const FETCH_BRANCH_SUCCESS = '[GitHub] Fetch branch succeeded';
export const FETCH_BRANCH_FAILED = '[GitHub] Fetch branch failed';

export const FETCH_BRANCHES_START = '[GitHub] Fetch branches start';
export const FETCH_BRANCHES_SUCCESS = '[GitHub] Fetch branches succeeded';
export const FETCH_BRANCHES_FAILED = '[GitHub] Fetch branches failed';

export interface GitEntity {
  guid: string;
  endpointGuid: string;
  scmType: string;
}

export interface GitRepo extends GitEntity {
  pushed_at?: string;
  last_activity_at?: string;
  created_at: string;
  owner: GitUser;
  id: number;
  full_name: string;
  default_branch: string;
  description: string;
  projectName: string;
  private: boolean;
  clone_url: string;
  html_url: string;
}

export interface GitSuggestedRepo {
  name: string;
  private: boolean;
}

export interface GitUser {
  avatar_url: string;
  html_url: string;
  id: number;
  login: string;
}

export interface GitBranch extends GitEntity {
  name: string;
  commit?: GitCommit;
  projectName: string;
}

export interface GitCommit extends GitEntity {
  sha: string;
  author?: GitUser;
  committer?: GitUser;
  html_url?: string;
  commit?: {
    author: {
      date: string;
      email: string;
      name: string;
    };
    message: string;
  };
  projectName: string;
}
