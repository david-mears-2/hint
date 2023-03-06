import {
    mockAxios, mockError,
    mockFailure, mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/metadata/actions";
import {MetadataMutations} from "../../app/store/metadata/mutations";

const rootState = mockRootState();
describe("Metadata actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("commits metadata after successful fetch", async () => {

        mockAxios.onGet(`/meta/plotting/Malawi`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        await actions.getPlottingMetadata({commit, rootState} as any, "Malawi");

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PlottingMetadataFetched", payload: "TEST DATA"});
    });

    it("commits error after unsuccessful (500) fetch", async () => {
        await testPlottingMetadataError(500);
    });

    it("commits error after unsuccessful (404) fetch", async () => {
        await testPlottingMetadataError(404);
    });

    it("commits ADR metadata after successful fetch", async () => {

        const adrMetadataResponse = {type: "summary", description: "summary"}

        mockAxios.onGet(`/meta/adr/1`)
            .reply(200, mockSuccess(adrMetadataResponse));

        const commit = jest.fn();
        await actions.getAdrUploadMetadata({commit, rootState} as any, "1");

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "AdrUploadMetadataFetched", payload: adrMetadataResponse});
    });

    it("commits ADR metadata error after failure to fetch", async () => {
        mockAxios.onGet(`/meta/adr/1`)
            .reply(500, mockFailure("ADR Metadata Failed"));

        const commit = jest.fn();
        await actions.getAdrUploadMetadata({commit, rootState} as any, "1");

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "AdrUploadMetadataError",
            payload: mockError("ADR Metadata Failed")
        });
    })

    async function testPlottingMetadataError(statusCode: number) {
        mockAxios.onGet(`/meta/plotting/Malawi`)
            .reply(statusCode, mockFailure("Test Error"));

        const commit = jest.fn();
        await actions.getPlottingMetadata({commit, rootState} as any, "Malawi");

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PlottingMetadataError",
            payload: mockError("Test Error")
        });
    }
});