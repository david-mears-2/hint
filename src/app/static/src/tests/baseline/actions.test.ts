import {mockAxios, mockPopulationResponse, mockShapeResponse, mockSuccess} from "../mocks";
import {actions} from "../../app/store/baseline/actions";
import {testUploadErrorCommitted} from "../actionTestHelpers";

const FormData = require("form-data");

describe("Baseline actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets country after PJNZ file upload", async () => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}}));

        const commit = jest.fn();
        await actions.uploadPJNZ({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZUpdated", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "PJNZUpdated", payload: {data: {country: "Malawi"}}});
    });

    testUploadErrorCommitted("/baseline/pjnz/", "PJNZUploadError", "PJNZUpdated", actions.uploadPJNZ);

    it("commits response after shape file upload", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onPost(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        await actions.uploadShape({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ShapeUpdated",
            payload: null
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ShapeUpdated",
            payload: mockShape
        });
    });

    it("commits response after population file upload", async () => {

        const mockPop = mockPopulationResponse();
        mockAxios.onPost(`/baseline/population/`)
            .reply(200, mockSuccess(mockPop));

        const commit = jest.fn();
        await actions.uploadPopulation({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PopulationUpdated",
            payload: null
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "PopulationUpdated",
            payload: mockPop
        });
    });

    testUploadErrorCommitted("/baseline/shape/", "ShapeUploadError", "ShapeUpdated", actions.uploadShape);

    it("gets baseline data and commits it", (done) => {

        const mockShape = mockShapeResponse();
        const mockPopulation = mockPopulationResponse();
        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}, filename: "test.pjnz"}));

        mockAxios.onGet(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        mockAxios.onGet(`/baseline/population/`)
            .reply(200, mockSuccess(mockPopulation));

        const commit = jest.fn();
        actions.getBaselineData({commit} as any);

        setTimeout(() => {
            const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
            expect(calls).toContain("PJNZUpdated");
            expect(calls).toContain("ShapeUpdated");
            expect(calls).toContain("PopulationUpdated");

            done();
        });

    });

    it("fails silently if getting baseline data fails", (done) => {

        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(500);

        mockAxios.onGet(`/baseline/shape/`)
            .reply(500);

        const commit = jest.fn();
        actions.getBaselineData({commit} as any);

        setTimeout(() => {
            expect(commit).toBeCalledTimes(0);
            done();
        });
    });

});