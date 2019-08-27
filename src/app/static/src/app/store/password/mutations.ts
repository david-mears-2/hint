import {PasswordState} from "./password";
import {PasswordPayload, RequestResetLinkError} from "./actions";
import {Mutation, MutationTree} from "vuex";

interface PasswordMutation extends Mutation<PasswordState> {
    payload?: PasswordPayload
}

export interface PasswordMutations {
    ResetLinkRequested:PasswordMutation
    RequestResetLinkError: PasswordMutation
}

export const mutations: MutationTree<PasswordState> & PasswordMutations = {
    ResetLinkRequested(state: PasswordState) {
        state.resetLinkRequested = true;
        state.requestResetLinkError = "";
    },

    RequestResetLinkError(state: PasswordState, action: RequestResetLinkError) {
        state.resetLinkRequested = false;
        state.requestResetLinkError = action.payload;
    }
};
