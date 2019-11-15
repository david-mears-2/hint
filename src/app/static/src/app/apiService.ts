import axios, {AxiosError, AxiosResponse} from "axios";
import {
    Response,
    ModelResultResponse,
    ModelSubmitResponse,
    ModelStatusResponse,
    ValidateInputResponse,
    SurveyResponse, AncResponse, ProgrammeResponse, PopulationResponse, ShapeResponse, PjnzResponse
} from "./generated";
import {Commit} from "vuex";
import {freezer} from "./utils";

type ResponseData =
    ValidateInputResponse
    | ModelSubmitResponse
    | ModelStatusResponse
    | ModelResultResponse
    | AncResponse
    | PjnzResponse
    | PopulationResponse
    | ProgrammeResponse
    | ShapeResponse
    | SurveyResponse
    | Boolean

declare var appUrl: string;

export interface API<S, E> {

    withError: (type: E) => API<S, E>
    withSuccess: (type: S) => API<S, E>
    ignoreErrors: () => API<S, E>

    postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T>
    get<T extends ResponseData>(url: string): Promise<void | T>
    delete(url: string): void
}

export class APIService<S extends string, E extends string> implements API<S, E> {

    private readonly _commit: Commit;

    constructor(commit: Commit) {
        this._commit = commit
    }

    // appUrl will be set as a jest global during testing
    private readonly _baseUrl = typeof appUrl !== "undefined" ? appUrl : "";

    private _buildFullUrl = (url: string) => {
        return this._baseUrl + url
    };

    private _ignoreErrors: Boolean = false;

    static getFirstErrorFromFailure = (failure: Response) => {
        const firstError = failure.errors[0];
        return firstError.detail ? firstError.detail : firstError.error;
    };

    private _onError: ((failure: Response) => void) | null = null;

    private _onSuccess: ((success: Response) => void) | null = null;

    withError = (type: E) => {
        this._onError = (failure: Response) => {
            this._commit({type: type, payload: APIService.getFirstErrorFromFailure(failure)});
        };
        return this
    };

    ignoreErrors = () => {
        this._ignoreErrors = true;
        return this;
    };

    withSuccess = (type: S) => {
        this._onSuccess = (data: any) => {
            this._commit({type: type, payload: freezer.deepFreeze(data)});
        };
        return this;
    };

    private _handleAxiosResponse(promise: Promise<AxiosResponse>) {
        return promise.then((response: AxiosResponse) => {
            const success = response && response.data;
            const data = success.data;
            if (this._onSuccess) {
                this._onSuccess(data);
            }
            return data;
        }).catch((e: AxiosError) => {
            return this._handleError(e)
        });
    }

    private _handleError = (e: AxiosError) => {
        console.log(e.response && e.response.data || e);
        if (this._ignoreErrors) {
            return
        }
        const failure = e.response && e.response.data as Response;
        if (!failure || !failure.status) {
            throw new Error("Could not parse API response");
        }
        if (this._onError) {
            this._onError(failure);
        }
        else {
            throw new Error(APIService.getFirstErrorFromFailure(failure));
        }
    };

    private _verifyHandlers(url: string) {
        if (this._onError == null && !this._ignoreErrors){
            console.warn(`No error handler registered for request ${url}.`)
        }
        if (this._onSuccess == null) {
            console.warn(`No success handler registered for request ${url}.`)
        }
    }

    async get<T extends ResponseData>(url: string): Promise<void | T> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.get(fullUrl));
    }

    async postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);

        // this allows us to pass data of type FormData in both the browser and
        // in node for testing, using the "form-data" package in the latter case
        const config = typeof data.getHeaders == "function" ? {
            headers: data.getHeaders()
        } : {};

        return this._handleAxiosResponse(axios.post(fullUrl, data, config));
    }

    async delete(url: string) {
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.delete(fullUrl));
    }

}

export const api = <S extends string, E extends string>(commit: Commit) => new APIService<S, E>(commit);
