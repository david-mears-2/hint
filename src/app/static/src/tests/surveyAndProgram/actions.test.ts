import {actions} from "../../app/store/surveyAndProgram/actions";
import {mockAxios, mockFailure, mockShapeResponse, mockSuccess} from "../mocks";

const FormData = require("form-data");

describe("Survey and program actions", () => {

    it("sets data after survey file upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(200, mockSuccess({data: {geoJson: "SOME GEOJSON"}}));

        const commit = jest.fn();
        await actions.uploadSurvey({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyLoaded",
            payload: {data: {geoJson: "SOME GEOJSON"}}
        });
    });

    it("sets error message after failed survey upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadSurvey({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyError",
            payload: "error message"
        });
    });

    it("sets data after program file upload", async () => {

        mockAxios.onPost(`/disease/program/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadProgram({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramLoaded",
            payload: "TEST"
        });
    });

    it("sets error message after failed program upload", async () => {

        mockAxios.onPost(`/disease/program/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadProgram({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramError",
            payload: "error message"
        });
    });

});