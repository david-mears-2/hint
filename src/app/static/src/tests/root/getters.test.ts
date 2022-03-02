import {getters} from "../../app/store/root/getters";
import {
    mockADRState,
    mockADRUploadState,
    mockBaselineState,
    mockDownloadResultsState,
    mockError,
    mockErrorsState,
    mockLoadState,
    mockMetadataState,
    mockModelCalibrateState,
    mockModelOptionsState,
    mockModelRunState, mockProjectsState,
    mockRootState, mockSurveyAndProgramState
} from "../mocks";
import {RootState} from "../../app/root";
import {initialDownloadResults} from "../../app/store/downloadResults/downloadResults";
import {Warnings} from "../../app/generated";
import {extractErrors} from "../../app/utils";
import {expectArraysEqual} from "../testHelpers";

describe("root getters", () => {

    function getResult(state: Partial<RootState>) {
        return getters.errors(mockRootState(state),
            null as any,
            null as any,
            null as any);
    }

    const modelOptionWarnings: Warnings = [
        {text: "model option test", locations: ["model_options"]}
    ]

    const calibrateWarnings: Warnings = [
        {text: "model calibrate test", locations: ["model_options", "model_calibrate"]}
    ]

    const modelRunWarnings: Warnings = [
        {text: "model run test", locations: ["model_fit"]}
    ]

    const testState = () => {
        return mockRootState({
            modelOptions: mockModelOptionsState({warnings: modelOptionWarnings}),
            modelRun: mockModelRunState({warnings: modelRunWarnings}),
            modelCalibrate: mockModelCalibrateState({warnings: calibrateWarnings})
        })
    }

    it("gets adr errors", async () => {

        const adrError = mockError("something went wrong");
        const keyError = mockError("something else went wrong");

        const stateWithErrors = mockADRState({
            adrError: adrError,
            keyError: keyError
        });

        const result = getResult({adr: stateWithErrors});
        expectArraysEqual(result, [adrError, keyError]);
    });

    it("gets adr upload errors", async () => {

        const error = mockError("something went wrong");

        const stateWithErrors = mockADRUploadState({
            uploadError: error
        });

        const result = getResult({adrUpload: stateWithErrors});
        expect(result).toEqual([error]);
    });

    it("gets baseline errors", async () => {

        const pjnz = mockError("pjnz");
        const shape = mockError("shape");
        const pop = mockError("pop");
        const err = mockError("err");

        const stateWithErrors = mockBaselineState({
            pjnzError: pjnz,
            shapeError: shape,
            populationError: pop,
            baselineError: err
        });

        const result = getResult({baseline: stateWithErrors});
        expectArraysEqual(result, [pjnz, shape, pop, err]);
    });

    it("gets download errors", async () => {

        const err = mockError("err")
        const stateWithErrors = mockDownloadResultsState({
            coarseOutput: {...initialDownloadResults, error: mockError("err")}
        });

        const result = getResult({downloadResults: stateWithErrors});
        expect(result).toEqual([err]);
    });

    it("gets global errors", async () => {

        const err1 = mockError("err1");
        const err2 = mockError("err2");

        const stateWithErrors = mockErrorsState({
            errors: [err1, err2]
        });

        const result = getResult({errors: stateWithErrors});
        expectArraysEqual(result, [err1, err2]);
    });

    it("gets load errors", async () => {

        const err = mockError("err")
        const stateWithErrors = mockLoadState({
            loadError: err
        });

        const result = getResult({load: stateWithErrors});
        expect(result).toEqual([err]);
    });

    it("gets metadata errors", async () => {

        const errPlot = mockError("errPlot")
        const errUpload = mockError("errUpload")

        const stateWithErrors = mockMetadataState({
            plottingMetadataError: errPlot,
            adrUploadMetadataError: errUpload
        });

        const result = getResult({metadata: stateWithErrors});
        expectArraysEqual(result, [errPlot, errUpload]);
    });

    it("gets calibration errors", async () => {

        const err = mockError("err");

        const stateWithErrors = mockModelCalibrateState({
            error: err
        });

        const result = getResult({modelCalibrate: stateWithErrors});
        expectArraysEqual(result, [err]);
    });

    it("gets model options errors", async () => {

        const optsErr = mockError("err");
        const validateErr = mockError("err");

        const stateWithErrors = mockModelOptionsState({
            optionsError: optsErr,
            validateError: validateErr
        });

        const result = getResult({modelOptions: stateWithErrors});
        expectArraysEqual(result, [optsErr, validateErr]);
    });

    it("gets model run errors", async () => {

        const err = mockError("err");

        const stateWithErrors = mockModelRunState({
            errors: [err]
        });

        const result = getResult({modelRun: stateWithErrors});
        expectArraysEqual(result, [err]);
    });

    it("gets project errors", async () => {
        const err = mockError("err");
        const cloneErr = mockError("clone")

        const stateWithErrors = mockProjectsState({
            error: err,
            cloneProjectError: cloneErr
        });

        const result = getResult({projects: stateWithErrors});
        expectArraysEqual(result, [err, cloneErr]);
    });

    it("gets survey and program errors", async () => {
        const surveyErr = mockError("survey");
        const ancErr = mockError("anc");
        const progErr = mockError("prog")

        const stateWithErrors = mockSurveyAndProgramState({
            surveyError: surveyErr,
            ancError: ancErr,
            programError: progErr
        });

        const result = getResult({surveyAndProgram: stateWithErrors});
        expectArraysEqual(result, [surveyErr, ancErr, progErr]);
    });

    it("gets errors from multiple modules", async () => {
        const err = mockError("err");
        const surveyErr = mockError("survey");
        const shapeErr = mockError("shape");

        const result = getResult({
            surveyAndProgram: mockSurveyAndProgramState({
                surveyError: surveyErr
            }),
            baseline: mockBaselineState({
                shapeError: shapeErr
            }),
            modelRun: mockModelRunState({
                errors: [err]
            })
        });
        expectArraysEqual(result, [surveyErr, shapeErr, err]);
    });

    describe("extractErrors", () => {

        it("can extract top level errors", () => {
            const test = {
                error: mockError("e1")
            }

            expect(extractErrors(test)).toEqual([mockError("e1")])
        });

        it("can extract nested errors", () => {
            const test = {
                something: {
                    error: mockError("e1")
                }
            }

            expect(extractErrors(test)).toEqual([mockError("e1")])
        });

        it("is case insensitive", () => {
            const test = {
                something: {
                    anError: mockError("e1"),
                    anothererror: mockError("e2")
                }
            }

            expect(extractErrors(test)).toEqual([mockError("e1"), mockError("e2")])
        });

        it("only matches words ending in 'error'", () => {
            const test = {
                something: {
                    anError: mockError("e1"),
                    shapeErroredFile: "notanerror",
                    randomProp: "alsonotanerror"
                }
            }

            expect(extractErrors(test)).toEqual([mockError("e1")])
        });

        it("omits nulls", () => {
            const test = {
                something: {
                    anError: null
                }
            }
            expect(extractErrors(test)).toEqual([])
        });
    });

    it(`can get modelRun warnings when on model run step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("fitModel").modelRun
        expect(result).toEqual(modelRunWarnings)
    })

    it(`can get modelCalibrate warnings when on model calibrate step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("calibrateModel").modelCalibrate
        expect(result).toEqual([
            {
                "locations": ["model_options", "model_calibrate"],
                "text": "model calibrate test"
            }
        ])
    })

    it(`can get modelCalibrate warnings if exists in modelOptions step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("modelOptions").modelCalibrate
        expect(result).toEqual([
            {
                locations: ["model_options", "model_calibrate"],
                text: "model calibrate test"
            }
        ])
    })

    it(`does not get modelOptions warnings if it does not exist on modelCalibrate step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("modelCalibrate").modelOptions
        expect(result).toEqual([])
    })

    it(`can get model options warnings`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("modelOptions").modelOptions
        expect(result).toEqual(modelOptionWarnings)
    })

    it(`can get empty warnings when all warnings properties are undefined in state`, () => {
        // We should be able to remove this test when warnings are fully implemented in hintr, as warnings
        // array will always be provided. Can also remove defensive code for this case in the getter.
        const rootState = mockRootState({
            modelOptions: mockModelOptionsState({warnings: undefined}),
            modelRun: mockModelRunState({warnings: undefined}),
            modelCalibrate: mockModelCalibrateState({warnings: undefined})
        });
        const warnings = getters.warnings(rootState, null, rootState, null);
        const expected = {
            modelOptions: [],
            modelRun: [],
            modelCalibrate: []
        };
        expect(warnings("modelOptions")).toStrictEqual(expected);
        expect(warnings("fitModel")).toStrictEqual(expected);
        expect(warnings("calibrateModel")).toStrictEqual(expected);
        expect(warnings("reviewOutput")).toStrictEqual(expected);
        expect(warnings("downloadResults")).toStrictEqual(expected);
    });

})
