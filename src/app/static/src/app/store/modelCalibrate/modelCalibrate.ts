import {Module} from "vuex";
import {ReadyState, RootState, WarningsState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo, Error, CalibrateStatusResponse, CalibrateResultResponse} from "../../generated";
import {BarchartIndicator, Filter} from "../../types";

export interface ModelCalibrateState extends ReadyState, WarningsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    fetching: boolean
    calibrateId: string
    statusPollId: number
    status: CalibrateStatusResponse
    calibrating: boolean
    complete: boolean
    generatingCalibrationPlot: boolean
    calibratePlotResult: any,
    result: CalibrateResultResponse | null
    version: VersionInfo
    error: Error | null
}

export const initialModelCalibrateState = (): ModelCalibrateState => {
    return {
        ready: false,
        optionsFormMeta: {controlSections: []},
        options: {},
        fetching: false,
        calibrateId: "",
        statusPollId: -1,
        status: {} as CalibrateStatusResponse,
        calibrating: false,
        complete: false,
        generatingCalibrationPlot: false,
        calibratePlotResult: null,
        result: {} as CalibrateResultResponse,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null,
        warnings: []
    }
};

export const modelCalibrateGetters = {
    indicators: (state: ModelCalibrateState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelCalibrate.calibratePlotResult!.plottingMetadata.barchart.indicators;
    },
    filters: (state: ModelCalibrateState, getters: any, rootState: RootState): Filter[] => {
        return rootState.modelCalibrate.calibratePlotResult!.plottingMetadata.barchart.filters;
    }
};

const namespaced = true;

const existingState = localStorageManager.getState();

export const modelCalibrate: Module<ModelCalibrateState, RootState> = {
    namespaced,
    state: {...initialModelCalibrateState(), ...existingState && existingState.modelCalibrate, ready: false},
    getters: modelCalibrateGetters,
    mutations,
    actions
};
