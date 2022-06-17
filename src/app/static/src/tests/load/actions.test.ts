import {
    mockAxios,
    mockError,
    mockFailure,
    mockLoadState, mockModelCalibrateState,
    mockOptionsFormMeta,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/load/actions";
import {LoadingState} from "../../app/store/load/load";
import {addCheckSum} from "../../app/utils";
import {localStorageManager} from "../../app/localStorageManager";
import {currentHintVersion} from "../../app/hintVersion";
import {DynamicControlType} from "@reside-ic/vue-dynamic-form";
import {RootState} from "../../app/root";

const rootState = mockRootState();

describe("Load actions", () => {

    beforeEach(() => {
        mockAxios.reset();
        // stop apiService logging to console
        console.log = jest.fn();
        console.info = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.info as jest.Mock).mockClear();
    });

    it("load reads blob and dispatches setFiles action", (done) => {
        const dispatch = jest.fn();
        actions.load({dispatch, rootState} as any,
            {
                file: new File(["Test File Contents"], "testFile"),
                projectName: "project name"
            });

        const interval = setInterval(() => {
            if (dispatch.mock.calls.length > 0) {
                expect(dispatch.mock.calls[0][0]).toEqual("setFiles");
                expect(dispatch.mock.calls[0][1].savedFileContents).toEqual("Test File Contents");
                expect(dispatch.mock.calls[0][1].projectName).toEqual("project name");
                clearInterval(interval);
                done();
            }
        });
    });

    it("clears loading state", async () => {
        const commit = jest.fn();
        await actions.clearLoadState({commit, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "LoadStateCleared", payload: null});
    });

    it("loadVersion sets files and updates store state", async (done) => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});

        await actions.loadFromVersion({commit, dispatch, state, rootState} as any, {
            files: "files",
            state: JSON.stringify({stepper: {}})
        });
        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
            expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

            expect(mockAxios.history.post[0].url).toBe("/session/files/");
            expect(mockAxios.history.post[0].data).toBe("files");

            expect(dispatch.mock.calls[0][0]).toBe("updateStoreState");
            expect(dispatch.mock.calls[0][1]).toStrictEqual({
                stepper: {
                    steps: [
                        {
                            "number": 1,
                            "textKey": "uploadInputs"
                        },
                        {
                            "number": 2,
                            "textKey": "reviewInputs"
                        },
                        {
                            "number": 3,
                            "textKey": "modelOptions"
                        },
                        {
                            "number": 4,
                            "textKey": "fitModel"
                        },
                        {
                            "number": 5,
                            "textKey": "calibrateModel"
                        },
                        {
                            "number": 6,
                            "textKey": "reviewOutput"
                        },
                        {
                            "number": 7,
                            "textKey": "downloadResults"
                        }
                    ]
                }
            });
            done();
        });
    });

    it("updates store state after successful setFiles post", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {"version": currentHintVersion, stepper: {}}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents, projectName: null}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

        //should also hand on to updateState action
        expect(dispatch.mock.calls[0][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({
            stepper: {
                steps: [
                    {
                        "number": 1,
                        "textKey": "uploadInputs"
                    },
                    {
                        "number": 2,
                        "textKey": "reviewInputs"
                    },
                    {
                        "number": 3,
                        "textKey": "modelOptions"
                    },
                    {
                        "number": 4,
                        "textKey": "fitModel"
                    },
                    {
                        "number": 5,
                        "textKey": "calibrateModel"
                    },
                    {
                        "number": 6,
                        "textKey": "reviewOutput"
                    },
                    {
                        "number": 7,
                        "textKey": "downloadResults"
                    }
                ]
            },
            "version": currentHintVersion
        });
    });

    it("if not guest, creates project and updates saved State before setting files", async () => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const testRootState = {
            version: currentHintVersion,
            projects: {
                currentProject: "TEST PROJECT",
                currentVersion: "TEST VERSION"
            }
        };
        const rootGetters = {isGuest: false};
        const fileContents = addCheckSum(JSON.stringify({
            files: "TEST FILES",
            state: {version: currentHintVersion, projects: {}, stepper: {}}
        }));

        await actions.setFiles({commit, state, dispatch, rootState: testRootState, rootGetters} as any,
            {savedFileContents: fileContents, projectName: "new project"}
        );

        expect(dispatch.mock.calls[0][0]).toEqual("projects/createProject");
        expect(dispatch.mock.calls[0][1]).toEqual("new project");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

        //should also hand on to updateState action, with updated project state
        expect(dispatch.mock.calls[1][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[1][1]).toStrictEqual(
            {
                version: currentHintVersion,
                projects: {
                    currentProject: "TEST PROJECT",
                    currentVersion: "TEST VERSION"
                },
                stepper: {
                    steps: [
                        {
                            "number": 1,
                            "textKey": "uploadInputs"
                        },
                        {
                            "number": 2,
                            "textKey": "reviewInputs"
                        },
                        {
                            "number": 3,
                            "textKey": "modelOptions"
                        },
                        {
                            "number": 4,
                            "textKey": "fitModel"
                        },
                        {
                            "number": 5,
                            "textKey": "calibrateModel"
                        },
                        {
                            "number": 6,
                            "textKey": "reviewOutput"
                        },
                        {
                            "number": 7,
                            "textKey": "downloadResults"
                        }
                    ]
                }
            });
    });

    it("calls loadFailed mutation with invalid checksum", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(400, mockFailure("Test error"));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.NotLoading});
        const dispatch = jest.fn();
        const fileContents = '["badchecksum", {"files": "TEST FILES", "state": "TEST STATE"}]';
        await actions.setFiles({commit, state, dispatch, rootState} as any,
            {savedFileContents: fileContents, projectName: null}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "LoadFailed",
            payload: {detail: "The file contents are corrupted."}
        });

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation after unsuccessful setFiles post", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(400, mockFailure("Test error"));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.LoadFailed});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {version: currentHintVersion, stepper: {}}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents, projectName: null}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "LoadFailed", payload: mockError("Test error")});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation when loaded state's version is not current", async () => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {"version": "0.0.0"}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents, projectName: null}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0].type).toStrictEqual("LoadFailed");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({detail: "Unable to load file created by older version of the application."});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation when loaded state does not contain a version", async () => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents, projectName: null}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0].type).toStrictEqual("LoadFailed");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({detail: "Unable to load file created by older version of the application."});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("can load file when state differs by minor version", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {"version": "2.1.0", stepper: {}}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents, projectName: null}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});
        expect(dispatch.mock.calls[0][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({
            stepper: {
                steps: [
                    {
                        "number": 1,
                        "textKey": "uploadInputs"
                    },
                    {
                        "number": 2,
                        "textKey": "reviewInputs"
                    },
                    {
                        "number": 3,
                        "textKey": "modelOptions"
                    },
                    {
                        "number": 4,
                        "textKey": "fitModel"
                    },
                    {
                        "number": 5,
                        "textKey": "calibrateModel"
                    },
                    {
                        "number": 6,
                        "textKey": "reviewOutput"
                    },
                    {
                        "number": 7,
                        "textKey": "downloadResults"
                    }
                ]
            },
            "version": "2.1.0"
        });
    });


    it("updateStoreState saves file state to local storage and reloads page", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState();
        await actions.updateStoreState({rootState} as any, testState);

        expect(mockSaveToLocalStorage.mock.calls[0][0]).toStrictEqual(testState);
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });

    it("extracts calibrate options from dynamicFormMeta and saves and loads file state", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                optionsFormMeta: mockOptionsFormMeta({
                    controlSections: [{
                        label: "Test Section",
                        description: "Just a test section",
                        controlGroups: [{
                            controls: [
                                {
                                    name: "TestValue",
                                    type: "number" as DynamicControlType,
                                    required: false,
                                    min: 0,
                                    max: 10,
                                    value: 5
                                },
                                {
                                    name: "TestValue2",
                                    type: "number" as DynamicControlType,
                                    required: false,
                                    min: 0,
                                    max: 10,
                                    value: 6
                                }
                            ]
                        }]
                    }]
                })
            })
        });

        await actions.updateStoreState({rootState} as any, testState);

        const root = mockSaveToLocalStorage.mock.calls[0][0] as RootState
        expect(root.modelCalibrate.options).toStrictEqual({"TestValue": 5, "TestValue2": 6});
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });

    it("calibrate options returns empty object if no options to extract from dynamic form meta", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                optionsFormMeta: mockOptionsFormMeta({
                    controlSections: []
                })
            })
        });

        await actions.updateStoreState({rootState} as any, testState);

        const root = mockSaveToLocalStorage.mock.calls[0][0] as RootState
        expect(root.modelCalibrate.options).toStrictEqual({});
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });
});
