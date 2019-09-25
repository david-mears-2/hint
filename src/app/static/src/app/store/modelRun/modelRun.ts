import {Module} from "vuex";
import {RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";

export interface ModelRunState {
    modelRunId: string
    status: ModelRunStatus,
    statusPollId: number,
    success: boolean,
    errors: any[]
}

export enum ModelRunStatus {
    "NotStarted",
    "Started",
    "Complete"
}

export const localStorageKey = "modelRun";

export const initialModelRunState: ModelRunState = {
    modelRunId: "",
    success: false,
    errors: [],
    status: ModelRunStatus.NotStarted,
    ...localStorageManager.getItem<ModelRunState>(localStorageKey),
    statusPollId: -1 // this will never be valid after a reload, so always set to -1
};

const namespaced: boolean = true;

export const modelRun: Module<ModelRunState, RootState> = {
    namespaced,
    state: initialModelRunState,
    actions,
    mutations
};
