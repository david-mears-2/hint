import axios, {AxiosError, AxiosResponse} from "axios";
import {InternalResponse} from "./types";
import {
    Failure,
    InitialiseModelRunResponse,
    ModelRunResultResponse,
    ValidateInputResponse
} from "./generated";
import {Commit} from "vuex";

type ResponseData =
    ValidateInputResponse
    | ModelRunResultResponse
    | InitialiseModelRunResponse
    | InternalResponse
    | Boolean

declare var appUrl: string;

export interface API {

    commitFirstErrorAsType: (commit: Commit, type: string) => API
    ignoreErrors: () => API

    postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T>

    get<T extends ResponseData>(url: string): Promise<void | T>
}

export class APIService implements API {

    // appUrl will be set as a jest global during testing
    private readonly _baseUrl = typeof appUrl !== "undefined" ? appUrl : "";

    private _buildFullUrl = (url: string) => {
        return this._baseUrl + url
    };

    private _ignoreErrors: Boolean = false;

    static getFirstErrorFromFailure = (failure: Failure) => {
        const firstError = failure.errors[0];
        return firstError.detail ? firstError.detail : firstError.error;
    };

    private _notifyOnError: ((failure: Failure) => void) = (failure: Failure) => {
        throw new Error(APIService.getFirstErrorFromFailure(failure));
    };

    commitFirstErrorAsType = (commit: Commit, type: string) => {
        // allows the consumer of the api service to commit
        // an action with the error as a payload rather than
        // throwing the error
        this._notifyOnError = (failure: Failure) => {
            commit({type: type, payload: APIService.getFirstErrorFromFailure(failure)});
        };
        return this
    };

    ignoreErrors = () => {
        this._ignoreErrors = true;
        return this;
    };

    private _handleAxiosResponse(promise: Promise<AxiosResponse>) {
        return promise.then((response: AxiosResponse) => {
            const success = response && response.data;
            return success.data
        }).catch((e: AxiosError) => {
            return this._handleError(e)
        });
    }

    private _handleError = (e: AxiosError) => {
        if (this._ignoreErrors) {
            return
        }
        const failure = e.response && e.response.data as Failure;
        if (!failure || !failure.status) {
            throw new Error("Could not parse API response");
        }
        this._notifyOnError(failure);
    };

    async get<T extends ResponseData>(url: string): Promise<void | T> {
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.get(fullUrl));
    }

    async postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T> {
        const fullUrl = this._buildFullUrl(url);

        // this allows us to pass data of type FormData in both the browser and
        // in node for testing, using the "form-data" package in the latter case
        const config = typeof data.getHeaders == "function" ? {
            headers: data.getHeaders()
        } : {};

        return this._handleAxiosResponse(axios.post(fullUrl, data, config));
    }

}

export const api = (): API => new APIService();
