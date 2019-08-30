import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {PjnzResponse} from "../../generated";
import {BaselineData, PayloadWithType} from "../../types";

type BaselineMutation = Mutation<BaselineState>

interface BaselineMutations {
    PJNZUploaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    BaselineDataLoaded: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZUploaded(state: BaselineState, action: PayloadWithType<PjnzResponse>) {
        state.pjnzError = "";
        state.pjnzFilename = action.payload.filename;
        state.country = action.payload.data.country;
        // TODO this step isn't really complete until all files are uploaded
        // but for now lets say it is
        state.complete = true;
    },

    PJNZUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.pjnzError = action.payload;
    },

    BaselineDataLoaded(state: BaselineState, action: PayloadWithType<BaselineData>) {
        const data = action.payload;
        if (data.pjnz){
            state.country = data.pjnz.data.country;
            state.pjnzFilename = data.pjnz.filename;
            // TODO this step isn't really complete until all files are uploaded
            // but for now lets say it is
            state.complete = true;
         }
    }
};

