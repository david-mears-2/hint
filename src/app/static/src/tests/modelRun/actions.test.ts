import {
    mockAxios,
    mockError,
    mockFailure,
    mockModelOptionsState,
    mockModelResultResponse,
    mockModelRunState,
    mockRootState,
    mockSuccess,
    mockWarning
} from "../mocks";
import {actions, getRunStatus} from "../../app/store/modelRun/actions";
import {ModelStatusResponse} from "../../app/generated";
import {expectEqualsFrozen} from "../testHelpers";
import {ModelRunMutation} from "../../app/store/modelRun/mutations";
import {freezer} from "../../app/utils";

const rootState = mockRootState();

describe("Model run actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.info as jest.Mock).mockClear();
        (console.warn as jest.Mock).mockClear();
    });

    it("passes model options and version from state", async () => {

        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const commit = jest.fn();
        const rootState = mockRootState({
            modelOptions: mockModelOptionsState({
                options: {1: "TEST"},
                version: "v1" as any
            })
        });

        const state = {
            statusPollId: -1
        };

        await actions.run({commit, rootState, state} as any);
        expect(JSON.parse(mockAxios.history.post[0].data))
            .toStrictEqual({options: {1: "TEST"}, version: "v1"})
    });

    it("commits run id after triggering a model run", async () => {

        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const state = {
            statusPollId: -1
        };

        const commit = jest.fn();
        await actions.run({commit, rootState, state} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "StartedRunning",
            payload: true
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ModelRunStarted",
            payload: {id: "12345"}
        });
    });

    it("if already polling, stops before triggering a new model run", async () => {
        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const state = {
            statusPollId: 9876
        };

        const commit = jest.fn();
        await actions.run({commit, rootState, state} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "StartedRunning",
            payload: true
        });
        expect(commit.mock.calls[1][0]).toBe("RunCancelled");
        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "ModelRunStarted",
            payload: {id: "12345"}
        });
    });

    it("fetches model run result after polling when status is done", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({status: {done: true} as ModelStatusResponse});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch, rootState} as any, "1234");

        setInterval(() => {
            expect(dispatch.mock.calls[0][0]).toStrictEqual("getResult");
            expect(dispatch.mock.calls[0][1]).toStrictEqual("1234");
            done();
        }, 2100);
    });

    it("does not fetch model run result after polling if done is not true", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({status: {done: false} as ModelStatusResponse});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch, rootState} as any, "1234");

        setInterval(() => {
            expect(dispatch.mock.calls.length).toEqual(0);
            done();
        }, 2100);

    });

    it("poll commits status when successfully fetched",  (done) => {
        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess("TEST DATA"));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockModelRunState();

        actions.poll({commit, state, rootState} as any, "1234");

        setTimeout(() => {
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "RunStatusUpdated",
                payload: "TEST DATA"
            });

            done();
        }, 2100);
    });

    it("poll commits error when unsuccessful fetch", (done) => {
        mockAxios.onGet(`/model/status/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState();

        actions.poll({commit, state, rootState} as any, "1234");

        setTimeout(() => {
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "RunStatusError",
                payload: mockError("Test Error")
            });

            done();
        }, 2100);
    });

    it("getResult commits result and warnings when successfully fetched", async () => {
        const mockResponse = mockSuccess(mockModelResultResponse({
            warnings: [mockWarning()]
        }));

        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockResponse);

        const commit = jest.fn();
        const spy = jest.spyOn(freezer, "deepFreeze");
        const state = mockModelRunState({
            modelRunId: "1234",
            status: {done: true} as ModelStatusResponse
        });

        await actions.getResult({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: ModelRunMutation.WarningsFetched,
            payload: [mockWarning()]
        });
        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: ModelRunMutation.RunResultFetched,
            payload: mockResponse.data
        });
        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "StartedRunning",
            payload: false
        });
        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
        expect(spy).toHaveBeenCalledWith(mockResponse);
    });

    it("getResult commits error when unsuccessful fetch", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: true, id: "1234"} as ModelStatusResponse});

        await actions.getResult({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(3)
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunResultError",
            payload: mockError("Test Error")
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "StartedRunning",
            payload: false
        });
        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });

    it("getResult does not get result if done is not true", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: false, id: "1234"} as ModelStatusResponse});

        await actions.getResult({commit, state, rootState} as any);

        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });

    it("cancel run calls endpoint and commits mutation", async () => {
        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "123"});

        await actions.cancelRun({commit, state, rootState} as any);

        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0].url).toBe("/model/cancel/123");

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunCancelled",
            payload: null
        });
    });

    it("doesn't request spectrum output status if id is not set", async () => {
        mockAxios.onGet(new RegExp(`/model/result/status/*`));

        const commit = jest.fn();
        const state = mockModelRunState();

        await getRunStatus({commit, state} as any, "");
        expect(mockAxios.history.get.length).toBe(0);

        const warnings = (console.warn as jest.Mock).mock.calls;
        expect(warnings[0][0]).toContain("Failed to poll for model run status with missing ID");
    });
});
