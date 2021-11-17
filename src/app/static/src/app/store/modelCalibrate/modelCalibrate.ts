import {Module} from "vuex";
import {ReadyState, RootState, WarningsState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo, Error, CalibrateStatusResponse} from "../../generated";
import {BarchartIndicator, Filter} from "../../types";
import {BarchartSelections, PlottingSelectionsState} from "../plottingSelections/plottingSelections";

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
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null,
        warnings: []
    }
};

export const modelCalibrateGetters = {
    indicators: (state: ModelCalibrateState): BarchartIndicator[] => {
        return state.calibratePlotResult!.plottingMetadata.barchart.indicators;
    },
    filters: (state: ModelCalibrateState): Filter[] => {
        return state.calibratePlotResult!.plottingMetadata.barchart.filters;
    },
    calibratePlotDefaultSelections: (state: ModelCalibrateState): BarchartSelections => {
        return state.calibratePlotResult!.plottingMetadata.barchart.defaults;
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
