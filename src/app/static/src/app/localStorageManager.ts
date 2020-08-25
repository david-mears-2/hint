import {RootState} from "./root";

const appStateKey = "appState";

export const serialiseState = (rootState: RootState): Partial<RootState> => {
    return {
        modelRun: {
            ...rootState.modelRun,
            statusPollId: -1,
            result: null,
            errors: []
        },
        modelOptions: rootState.modelOptions,
        modelOutput: rootState.modelOutput,
        stepper: rootState.stepper,
        metadata: {...rootState.metadata, plottingMetadataError: null},
        plottingSelections: rootState.plottingSelections,
        surveyAndProgram: {selectedDataType: rootState.surveyAndProgram.selectedDataType} as any,
        versions: rootState.versions
    };
};

declare const currentUser: string;

export class LocalStorageManager {

    saveState = (state: RootState) => {
        const partialState = serialiseState(state);
        this.savePartialState(partialState);
    };

    savePartialState = (partialState: Partial<RootState>) => {
        console.log("SAVING PARTIAL STATE");
        console.log("VERSIONS: " + JSON.stringify(partialState.versions));
        window.localStorage.setItem(appStateKey, JSON.stringify(partialState));
    };

    getState = () : Partial<RootState> | null => {
        if (currentUser != window.localStorage.getItem("user")){
            localStorage.clear();
            localStorage.setItem("user", currentUser);
        }
        const item = window.localStorage.getItem(appStateKey);
        if (item) {
            return JSON.parse(item) as Partial<RootState>;
        }
        else {
            return null;
        }
    };
}

export const localStorageManager = new LocalStorageManager();
