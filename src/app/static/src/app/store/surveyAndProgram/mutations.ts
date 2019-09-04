import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {PayloadWithType, ProgramResponse, SurveyResponse, ANCResponse} from "../../types";

type SurveyAndProgramMutation = Mutation<SurveyAndProgramDataState>

export interface SurveyAndProgramMutations {
    SurveyLoaded: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation,
    ProgramLoaded: SurveyAndProgramMutation
    ProgramError: SurveyAndProgramMutation,
    ANCLoaded: SurveyAndProgramMutation
    ANCError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<SurveyResponse>) {
        state.survey = action.payload;
    },

    SurveyError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.surveyError = action.payload;
    },

    ProgramLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<ProgramResponse>) {
        state.program = action.payload;
    },

    ProgramError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.programError = action.payload;
    },

    ANCLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<ANCResponse>) {
        state.anc = action.payload;
    },

    ANCError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.ancError = action.payload;
    }
};
