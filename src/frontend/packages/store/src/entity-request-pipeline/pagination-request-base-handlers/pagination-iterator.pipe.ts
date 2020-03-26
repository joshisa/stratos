import { HttpRequest } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, range } from 'rxjs';
import { map, mergeMap, reduce, switchMap } from 'rxjs/operators';

import { UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { AppState } from '../../app-state';
import { entityCatalog } from '../../entity-catalog/entity-catalog.service';
import { PaginatedAction, PaginationMaxedState } from '../../types/pagination.types';
import { ActionDispatcher, JetstreamResponse, PagedJetstreamResponse } from '../entity-request-pipeline.types';
import { PipelineHttpClient } from '../pipline-http-client.service';


export interface PaginationPageIteratorConfig<R = any, E = any> {
  // TODO This should also pass page size for apis that use start=&end= params.
  getPaginationParameters: (page: number) => Record<string, string>;
  getTotalPages: (initialResponses: JetstreamResponse<R>) => number;
  getTotalEntities: (initialResponses: JetstreamResponse<R>) => number;
  getEntitiesFromResponse: (responses: R) => E[];
  // // only applicable to is local
  getMaxEntities: (store: Store<AppState>, action: PaginatedAction) => Observable<number>;
  canIgnoreMaxedState: (store: Store<AppState>) => Observable<boolean>;
}

export class PaginationPageIterator<R = any, E = any> {
  constructor(
    private store: Store<AppState>,
    private httpClient: PipelineHttpClient,
    public baseHttpRequest: HttpRequest<JetstreamResponse<R>>,
    public action: PaginatedAction,
    public actionDispatcher: ActionDispatcher,
    public config: PaginationPageIteratorConfig<R, E>,
    // private ignorePaginationMaxed?: boolean,
    private paginationMaxedState?: PaginationMaxedState
  ) { }

  private makeRequest(httpRequest: HttpRequest<JetstreamResponse<R>>) {
    return this.httpClient.pipelineRequest<JetstreamResponse<R>>(
      httpRequest,
      entityCatalog.getEndpoint(this.action.endpointType, this.action.subType),
      this.action.endpointGuid,
      this.action.externalRequest
    );
  }

  private getAllOtherPageRequests(totalPages: number): Observable<JetstreamResponse<R>[]> {
    const start = 2;
    const count = totalPages - start;
    if (count < 0) {
      return of([]);
    }
    return range(2, count + 1).pipe(
      mergeMap(currentPage => this.makeRequest(this.addPageToRequest(currentPage)), 5), // TODO: RC why only 5 concurrent?
      reduce((acc, res: JetstreamResponse<R>) => {
        acc.push(res);
        return acc;
      }, [] as JetstreamResponse<R>[])
    );
  }

  private addPageToRequest(page: number) {
    const newParamsObject = this.config.getPaginationParameters(page);
    const newParams = Object.keys(newParamsObject).reduce((params, key) => {
      return params.set(key, newParamsObject[key]);
    }, this.baseHttpRequest.params);
    return this.baseHttpRequest.clone({
      params: newParams
    });
  }

  private reducePages(responsePages: JetstreamResponse<R>[]) {
    return responsePages.reduce((mergedResponse, page) => {
      // Merge all 'pages' into pages of endpoint responses;
      return Object.keys(page).reduce((responses, endpointId) => {
        if (!responses[endpointId]) {
          responses[endpointId] = [];
        }
        return {
          ...responses,
          [endpointId]: [
            ...(responses[endpointId] as any[]),
            page[endpointId]
          ]
        };
      }, mergedResponse);
    }, {} as PagedJetstreamResponse);
  }

  private handleRequests(initialResponse: JetstreamResponse<R>, action: PaginatedAction, totalPages: number, totalResults: number):
    Observable<[JetstreamResponse<R>, JetstreamResponse<R>[]]> {

    const allResults = combineLatest(of(initialResponse), this.getAllOtherPageRequests(totalPages));

    if (totalResults === 0 || this.paginationMaxedState.ignoreMaxed) {
      return allResults;
    }

    return this.config.getMaxEntities().pipe(
      switchMap(maxEntities => {
        if (maxEntities && maxEntities < totalResults) {
          // console.log(this.paginationMaxedState);
          // We're maxed so only respond with the first page of results.
          const { entityType, endpointType, paginationKey, __forcedPageEntityConfig__ } = action;
          const forcedEntityKey = entityCatalog.getEntityKey(__forcedPageEntityConfig__);
          this.actionDispatcher(
            new UpdatePaginationMaxedState(maxEntities, totalResults, entityType, endpointType, paginationKey, forcedEntityKey)
          );
          const otherPages: JetstreamResponse<R>[] = [];
          // const obs: Observable<JetstreamResponse<R>[]> = of(otherPages);
          return combineLatest([of(initialResponse), of(otherPages)]);
        }
        return allResults;
      })
    );

    // if (totalResults > 0) {
    //   // const maxCount = action.flattenPaginationMax;
    //   const maxCount = this.paginationMaxedState.max || Number.MAX_SAFE_INTEGER;
    //   console.log(this.paginationMaxedState);
    //   if (!this.paginationMaxedState.ignoreMaxed && maxCount < totalResults) {
    //     // We're maxed so only respond with the first page of results.
    //     const { entityType, endpointType, paginationKey, __forcedPageEntityConfig__ } = action;
    //     const forcedEntityKey = entityCatalog.getEntityKey(__forcedPageEntityConfig__);
    //     this.actionDispatcher(
    //       new UpdatePaginationMaxedState(maxCount, totalResults, entityType, endpointType, paginationKey, forcedEntityKey)
    //     );
    //     return of([initialResponse, []]);
    //   }
    // }
    // return combineLatest(of(initialResponse), this.getAllOtherPageRequests(totalPages));
  }

  private getValidNumber(num: number) {
    return typeof num === 'number' && !isNaN(num) ? num : 0;
  }

  public mergeAllPagesEntities(): Observable<PagedJetstreamResponse> {
    const initialRequest = this.addPageToRequest(1);
    return this.makeRequest(initialRequest).pipe(
      mergeMap(initialResponse => {
        const totalPages = this.config.getTotalPages(initialResponse);
        const totalResults = this.config.getTotalEntities(initialResponse);
        return this.handleRequests(
          initialResponse,
          this.action,
          this.getValidNumber(totalPages),
          this.getValidNumber(totalResults)
        ).pipe(
          map(([initialRequestResponse, othersResponse]) => [initialRequestResponse, ...othersResponse]),
          map(responsePages => this.reducePages(responsePages)),
        );
      })
    );
  }
}
