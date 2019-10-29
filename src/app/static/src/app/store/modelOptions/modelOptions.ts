import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta, formMeta} from "../../components/forms/types";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";

export interface ModelOptionsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    valid: boolean
}

export const initialModelOptionsState: ModelOptionsState = {
    optionsFormMeta: {...formMeta},
    options: {},
    valid: false
};

export const modelOptionsGetters = {
    complete: (state: ModelOptionsState) => {
        return state.valid
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const modelOptions: Module<ModelOptionsState, RootState> = {
    namespaced,
    state: {...initialModelOptionsState, ...existingState && existingState.modelOptions},
    mutations,
    getters: modelOptionsGetters
};
