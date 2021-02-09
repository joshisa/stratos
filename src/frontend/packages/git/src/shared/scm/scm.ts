import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GitBranch, GitCommit, GitRepo, GitSuggestedRepo } from '../../store/git.public-types';
import { GitApiRequest } from './scm-base';
import { GitSCMType } from './scm.service';

export interface SCMIcon {
  iconName: string;
  fontName: string;
}

// Interface that a Git SCM provider must implement
export interface GitSCM {
  endpointGuid: string;
  getType(): GitSCMType;
  getLabel(): string;
  getIcon(): SCMIcon;
  getPublicApi(): string;
  getAPI(): Observable<GitApiRequest>;
  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo>;
  getBranch(httpClient: HttpClient, projectName: string, branchId: string): Observable<GitBranch>;
  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]>;
  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit>;
  convertCommit(commit: any): GitCommit;
  getCommits(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit[]>;
  getCommitApi(projectName: string, commitSha: string): Observable<GitApiRequest>;
  getCompareCommitURL(projectUrl: string, commitSha1: string, commitSha2: string): string;
  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<GitSuggestedRepo[]>;
  parseErrorAsString(error: any): string;
}

export interface GitMeta {
  projectName: string;
  scm: GitSCM; // FIXME: Remove from action, see #4245
  commitSha?: string;
  branchName?: string;
}
