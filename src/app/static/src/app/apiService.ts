import axios, {AxiosError, AxiosResponse} from "axios";
import {ErrorsMutation} from "./store/errors/mutations";
import {ActionContext, Commit} from "vuex";
import {freezer, isHINTResponse, readStream} from "./utils";
import {Error, Response} from "./generated";
import i18next from "i18next";
import {GenericResponse, TranslatableState} from "./types";
import {getSpectrumOutputStatus} from "./store/downloadResults/actions";

declare let appUrl: string;

export interface ResponseWithType<T> extends GenericResponse<T> {
    data: T
}

export interface API<S, E> {

    withError: (type: E) => API<S, E>
    withSuccess: (type: S, root: boolean) => API<S, E>
    ignoreErrors: () => API<S, E>
    ignoreSuccess: () => API<S, E>

    postAndReturn<T>(url: string, data: any): Promise<void | ResponseWithType<T>>

    get<T>(url: string): Promise<void | ResponseWithType<T>>

    delete(url: string): Promise<void | true>

    stream<T>(url: string): Promise<void | ResponseWithType<T>>
}

export class APIService<S extends string, E extends string> implements API<S, E> {

    private readonly _commit: Commit;
    private readonly _headers: any;

    constructor(context: ActionContext<any, TranslatableState>) {
        this._commit = context.commit;
        this._headers = {"Accept-Language": context.rootState.language};
    }

    // appUrl will be set as a jest global during testing
    private readonly _baseUrl = typeof appUrl !== "undefined" ? appUrl : "";

    private _buildFullUrl = (url: string) => {
        return this._baseUrl + url
    };

    private _ignoreErrors = false;
    private _ignoreSuccess = false;
    private _freezeResponse = false;

    static getFirstErrorFromFailure = (failure: Response) => {
        if (failure.errors.length == 0) {
            return APIService.createError("apiMissingError");
        }
        return failure.errors[0];
    };

    static createError(detail: string) {
        return {
            error: "MALFORMED_RESPONSE",
            detail: i18next.t(detail)
        }
    }

    private _onError: ((failure: Response) => void) | null = null;

    private _onSuccess: ((success: Response) => void) | null = null;

    freezeResponse = () => {
        this._freezeResponse = true;
        return this;
    };

    withError = (type: E, root = false) => {
        this._onError = (failure: Response) => {
            this._commit({type: type, payload: APIService.getFirstErrorFromFailure(failure)}, {root});
        };
        return this;
    };

    ignoreErrors = () => {
        this._ignoreErrors = true;
        return this;
    };

    ignoreSuccess = () => {
        this._ignoreSuccess = true;
        return this;
    };

    withSuccess = (type: S, root = false) => {
        this._onSuccess = (data: any) => {
            const toCommit = {type: type, payload: data};
            if (root) {
                this._commit(toCommit, {root: true});
            } else {
                this._commit(toCommit);
            }

        };
        return this;
    };

    private _handleAxiosResponse(promise: Promise<AxiosResponse>) {
        return promise.then((axiosResponse: AxiosResponse) => {
            const success = axiosResponse && axiosResponse.data;
            const finalResponse = this._freezeResponse ? freezer.deepFreeze(success) : success;
            const data = finalResponse.data;
            if (this._onSuccess) {
                this._onSuccess(data);
            }
            return finalResponse;
        }).catch((e: AxiosError) => {
            return this._handleError(e)
        });
    }

    private _handleError = (e: AxiosError) => {
        console.log(e.response && e.response.data || e);
        if (this._ignoreErrors) {
            return
        }
        this._handle401Error(e)

        this._handleCommitError(e.response && e.response.data)
    };

    private _commitError = (error: Error) => {
        this._commit({type: `errors/${ErrorsMutation.ErrorAdded}`, payload: error}, {root: true});
    };

    private _verifyHandlers(url: string) {
        if (this._onError == null && !this._ignoreErrors) {
            console.warn(`No error handler registered for request ${url}.`)
        }
        if (this._onSuccess == null && !this._ignoreSuccess) {
            console.warn(`No success handler registered for request ${url}.`)
        }
    }

    async get<T>(url: string): Promise<void | ResponseWithType<T>> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.get(fullUrl, {headers: this._headers}));
    }

    private _handleDownloadError = async (e: AxiosError) => {
        console.log(e.response && e.response.data || e);

        this._handle401Error(e)

        const response = e.response && e.response.data;

        if (response instanceof Blob) {

            const fileReader = new FileReader()

            const data = await response.text()

            fileReader.onload = () => {
                this._handleCommitError(JSON.parse(data))
            }

            fileReader.readAsText(response);
        } else {
            this._handleCommitError(response)
        }
    }

    private _handle401Error = (e: AxiosError) => {
        if (e.response && e.response.status == 401) {

            const messenger = i18next.t("sessionExpiredLogin")

            const message = encodeURIComponent(messenger)

            window.location.assign("/login?error=SessionExpired&message=" + message)
        }
    }

    private _handleCommitError = (error: any) => {
        if (!isHINTResponse(error)) {
            this._commitError(APIService.createError("apiCouldNotParseError"));
        } else if (this._onError) {
            this._onError(error);
        } else {
            this._commitError(APIService.getFirstErrorFromFailure(error));
        }
    }

    private _handleDownloadResponse = (response: AxiosResponse) => {
        readStream(response)
    }

    //Initiates a download. NB any withSuccess mutation will be ignored for downloads.
    async download(url: string): Promise<any> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);

        return axios.get(fullUrl, {headers: this._headers, responseType: "blob"})
            .then((response: AxiosResponse) => this._handleDownloadResponse(response))
            .catch((e: AxiosError) => this._handleDownloadError(e));
    }

    //This proof-of-concept code will be refactored to handle errors and additional functionalities.
     async stream<T>(url: string): Promise<T> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);

        return fetch(fullUrl, { method: 'GET' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const stream = response.body;

                if (!stream) {
                    throw new Error('Response body is not a ReadableStream.');
                }

                const chunks: Uint8Array[] = [];

                const reader = stream.getReader();

                const readChunks = async (): Promise<Uint8Array[]> => {
                    const {done, value} = await reader.read();
                    if (done) return chunks;
                    if (value) chunks.push(value);
                    return readChunks();
                };

                return readChunks();
            })
            .then(chunks => {
                if (chunks.length === 0) {
                    throw new Error('Empty response body');
                }

                const concatenatedChunks = new Uint8Array(
                    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
                );

                let offset = 0;
                for (const chunk of chunks) {
                    concatenatedChunks.set(chunk, offset);
                    offset += chunk.length;
                }

                const jsonString = new TextDecoder().decode(concatenatedChunks);

                console.log(JSON.parse(jsonString));

                return JSON.parse(jsonString);
            })
            .catch(error => {
                console.error(error);
                throw error;
            });
    }


    async postAndReturn<T>(url: string, data?: any): Promise<void | ResponseWithType<T>> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);

        // this allows us to pass data of type FormData in both the browser and
        // in node for testing, using the "form-data" package in the latter case
        const headers = data && typeof data.getHeaders == "function" ?
            {...this._headers, ...data.getHeaders()}
            : this._headers;

        return this._handleAxiosResponse(axios.post(fullUrl, data, {headers}));
    }

    async delete(url: string) {
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.delete(fullUrl));
    }

}

export const api =
    <S extends string, E extends string>(context: ActionContext<any, TranslatableState>) => new APIService<S, E>(context);
