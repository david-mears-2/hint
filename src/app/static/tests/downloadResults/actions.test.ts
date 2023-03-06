import {
    mockAxios, mockDownloadResultsDependency,
    mockDownloadResultsState, mockError, mockFailure, mockMetadataState, mockModelCalibrateState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/downloadResults/actions";
import {DOWNLOAD_TYPE} from "../../app/types";
import {DownloadStatusResponse} from "../../app/generated";

const RunningStatusResponse: DownloadStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: false,
    progress: ["Generating summary report"],
    status: "RUNNING",
    success: null,
    queue: 0
}

const CompleteStatusResponse: DownloadStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: true,
    progress: ["Generating summary report"],
    status: "COMPLETE",
    success: true,
    queue: 0
}

describe(`download Results actions`, () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    it("prepare summary commits download id and starts polling for status", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"})
        });

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/summary/calibrate1`)
            .reply(200, mockSuccess(partialDownloadResultsState));

        await actions.prepareSummaryReport({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("SetFetchingDownloadId")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(DOWNLOAD_TYPE.SUMMARY)
        expect(commit.mock.calls[1][0]["type"]).toBe("PreparingSummaryReport")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(partialDownloadResultsState)
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["url"]).toBe("download/submit/summary/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.SUMMARY])
    });

    it("prepare summary does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareSummaryReport({commit, state} as any);
        expect(mockAxios.history.post.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("prepare summary does not do anything if fetchingDownloadId is set", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency({fetchingDownloadId: true})
        });

        await actions.prepareSummaryReport({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("can poll for summary status, get pollId and commit result", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn()
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryReportStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("does not poll for summary status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/summary/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareSummaryReport({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "SummaryError",
            payload: mockError("TEST FAILED")
        });
    });

    it("gets adr upload metadata if summary status is done", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryReportStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("does get adr upload metadata error for summary if metadata request is successful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryReportStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(commit.mock.calls[2][0]["type"]).toBe("SummaryMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toBeNull()

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("can get adr upload metadata error for summary if metadata request is unsuccessful", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        const rootState = mockRootState({
            metadata: mockMetadataState({
                adrUploadMetadataError: mockError("METADATA REQUEST FAILED")
            })
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryReportStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("SummaryMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(mockError("METADATA REQUEST FAILED"))
            done()
        }, 2100)
    });

    it("does not continue to poll summary status when unsuccessful", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SummaryError",
                payload: mockError("TEST FAILED")
            });
            done()
        }, 2100)
    });

    it("can submit spectrum download request, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"})
        });

        const getter = {projectState: "json"}

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/spectrum/calibrate1`, "json")
            .reply(200, mockSuccess(downloadId));

        await actions.prepareSpectrumOutput({commit, state, dispatch, rootState: root, rootGetters: getter} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("SetFetchingDownloadId")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(DOWNLOAD_TYPE.SPECTRUM)
        expect(commit.mock.calls[1][0]["type"]).toBe("PreparingSpectrumOutput")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["url"]).toBe("download/submit/spectrum/calibrate1");
        expect(mockAxios.history.post[0]["data"]).toBe("json");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.SPECTRUM])
    });

    it("prepare spectrum does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareSpectrumOutput({commit, state} as any);
        expect(mockAxios.history.post.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("prepare spectrum does not do anything if fetchingDownloadId is set", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({fetchingDownloadId: true})
        });

        await actions.prepareSpectrumOutput({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("can invoke spectrum poll action, gets pollId, commits PollingStatusStarted",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()

        }, 2100)
    });

    it("can poll for spectrum output status", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("gets adr upload metadata if spectrum status is done",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("does get adr upload metadata error for spectrum if metadata request is successful", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("SpectrumMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toBeNull()
            done()
        }, 2100)
    });

    it("can get adr upload metadata error for spectrum if metadata request is unsuccessful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        const rootState = mockRootState({
            metadata: mockMetadataState({
                adrUploadMetadataError: mockError("METADATA REQUEST FAILED")
            })
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("SpectrumMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(mockError("METADATA REQUEST FAILED"))
            done()
        }, 2100)
    });

    it("does not start polling for spectrum output status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        const getter = {projectState: "json"}

        mockAxios.onPost(`download/submit/spectrum/calibrate1`, "json")
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareSpectrumOutput({commit, state, dispatch, rootState: root, rootGetters: getter} as any);

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "SpectrumError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll spectrum status when unsuccessful", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SpectrumError",
                payload: mockError("TEST FAILED")
            });

            done()

        }, 2100)
    });

    it("can prepare coarse output, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/coarse-output/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.prepareCoarseOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("SetFetchingDownloadId")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(DOWNLOAD_TYPE.COARSE)
        expect(commit.mock.calls[1][0]["type"]).toBe("PreparingCoarseOutput")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["url"]).toBe("download/submit/coarse-output/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.COARSE])
    });

    it("prepare coarse output does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareCoarseOutput({commit, state} as any);
        expect(mockAxios.history.post.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("prepare coarse output does not do anything if fetchingDownloadId is set", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({fetchingDownloadId: true})
        });

        await actions.prepareCoarseOutput({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("gets adr upload metadata if coarse output status is done",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("does get adr upload metadata error for coarseOutput if metadata request is successful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("CoarseOutputMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toBeNull()
            done()
        }, 2100)
    });

    it("can get adr upload metadata error for coarseOutput if metadata request is unsuccessful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        const rootState = mockRootState({
            metadata: mockMetadataState({
                adrUploadMetadataError: mockError("METADATA REQUEST FAILED")
            })
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("CoarseOutputMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(mockError("METADATA REQUEST FAILED"))
            done()
        }, 2100)
    });

    it("can invoke coarse output poll action, get pollId and commit PollingStatusStarted",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("can get coarse output status results",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)

            done()
        }, 2100)
    });

    it("does not poll for coarse output status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/coarse-output/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareCoarseOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "CoarseOutputError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll coarse output status when unsuccessful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});

        const state = mockDownloadResultsState({
            coarseOutput: partialDownloadResultsState
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "CoarseOutputError",
                payload: mockError("TEST FAILED")
            });

            done()
        }, 2100)
    });

    it("can submit comparison download request, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"})
        });

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/comparison/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.prepareComparisonOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("SetFetchingDownloadId")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(DOWNLOAD_TYPE.COMPARISON)
        expect(commit.mock.calls[1][0]["type"]).toBe("PreparingComparisonOutput")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["url"]).toBe("download/submit/comparison/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.COMPARISON])
    });

    it("prepare comparison does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareComparisonOutput({commit, state} as any);
        expect(mockAxios.history.post.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("download comparison report", async () => {
        const commit = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.downloadComparisonReport({commit, state, rootState: root} as any,);
        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("errors/ErrorAdded")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(
            {
                detail: "Could not parse API response. Please contact support.",
                error: "MALFORMED_RESPONSE"
            }
        )
        expect(mockAxios.history.get.length).toBe(1);

        expect(mockAxios.history.get[0]["url"]).toBe("download/result/1");
    });

    it("prepare comparison does not do anything if fetchingDownloadId is set", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({fetchingDownloadId: true})
        });

        await actions.prepareComparisonOutput({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("can invoke comparison poll action, gets pollId, commits PollingStatusStarted",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.COMPARISON);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COMPARISON)

            expect(commit.mock.calls[1][0]["type"]).toBe("ComparisonOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()

        }, 2100)
    });

    it("can poll for comparison output status", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COMPARISON);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COMPARISON)

            expect(commit.mock.calls[1][0]["type"]).toBe("ComparisonOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("gets adr upload metadata if comparison status is done",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COMPARISON);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("ComparisonOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });


    it("does get adr upload metadata error for comparison if metadata request is successful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COMPARISON);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("ComparisonOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("ComparisonOutputMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toBeNull()
            done()
        }, 2100)
    });

    it("can get adr upload metadata error for comparison if metadata request is unsuccessful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency(
                {metadataError: mockError("test"), downloadId: "1"})
        });

        const rootState = mockRootState({
            metadata: mockMetadataState({
                adrUploadMetadataError: mockError("METADATA REQUEST FAILED")
            })
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({commit, state, dispatch, rootState} as any, DOWNLOAD_TYPE.COMPARISON);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("ComparisonOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)

            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})

            expect(commit.mock.calls[2][0]["type"]).toBe("ComparisonOutputMetadataError")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(mockError("METADATA REQUEST FAILED"))
            done()
        }, 2100)
    });

    it("does not start polling for comparison output status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onPost(`download/submit/comparison/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareComparisonOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ComparisonError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll comparison status when unsuccessful",  (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            comparison: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COMPARISON);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COMPARISON)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "ComparisonError",
                payload: mockError("TEST FAILED")
            });

            done()

        }, 2100)
    });

    it("can prepare all outputs", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        await actions.prepareOutputs({commit, dispatch} as any);

        expect(dispatch.mock.calls.length).toBe(4);
        expect(dispatch.mock.calls[0][0]).toBe("prepareCoarseOutput");
        expect(dispatch.mock.calls[1][0]).toBe("prepareSummaryReport");
        expect(dispatch.mock.calls[2][0]).toBe("prepareSpectrumOutput");
        expect(dispatch.mock.calls[3][0]).toBe("prepareComparisonOutput");
    });
});
