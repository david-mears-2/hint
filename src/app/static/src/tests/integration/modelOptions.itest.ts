import {actions} from "../../app/store/modelOptions/actions";
import {login, rootState} from "./integrationTest";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as surveyActions} from "../../app/store/surveyAndProgram/actions";
import { ModelOptionsMutation } from "../../app/store/modelOptions/mutations";
import { Language } from "../../app/store/translations/locales";
import {getFormData} from "./helpers";
import { isDynamicFormMeta } from "../../app/vue-dynamic-form/src";

const fs = require("fs");
const FormData = require("form-data");

describe("model options actions integration", () => {

    beforeAll(async () => {
        await login();

        const commit = jest.fn();
        const dispatch = jest.fn();

        let formData = getFormData("../testdata/malawi.geojson") ;

        await baselineActions.uploadShape({commit, dispatch, rootState} as any, formData);

        formData = getFormData("../testdata/survey.csv") ;

        await surveyActions.uploadSurvey({commit, dispatch, rootState} as any, formData);
    });

    it("can get valid model options", async () => {
        const commit = jest.fn();
        await actions.fetchModelRunOptions({commit, rootState} as any);
        expect(commit.mock.calls[1][0]["type"]).toBe("ModelOptionsFetched");
        const payload = commit.mock.calls[1][0]["payload"];
        expect(isDynamicFormMeta(payload)).toBe(true);

        expect(commit.mock.calls[2][0]["type"]).toBe("SetModelOptionsVersion");
        expect(commit.mock.calls[2][0]["payload"]).toBeDefined();
    });

    
    it("can validate model options", async () => {
        const commit = jest.fn();
        const options =  jest.fn()
        const version = jest.fn()
      
        const mockState = {
            language: Language.en,
            modelOptions: {
                options: {},
                version: {}
            }
        }
        //passed mock params which will return validation error
        await actions.validateModelOptions({commit, rootState: mockState} as any, {options,version} as any);
        expect(commit.mock.calls[0][0]).toBe(ModelOptionsMutation.Validating);
        expect(commit.mock.calls[1][0]).toBe(ModelOptionsMutation.LoadUpdatedOptions);
        expect(commit.mock.calls[2][0]["type"]).toBe(ModelOptionsMutation.HasValidationError);
        expect(commit.mock.calls[2][0]["payload"]["error"]).toBe("INVALID_INPUT")
    });
});
