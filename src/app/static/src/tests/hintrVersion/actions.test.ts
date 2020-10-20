import {mockAxios, mockSuccess, mockFailure, mockRootState} from "../mocks";
import {actions} from '../../app/store/hintrVersion/actions';
import { HintrVersionMutation } from "../../app/store/hintrVersion/mutations";

const rootState = mockRootState();

describe("hintrVersion Action ", ()=> {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("commits hintrVersion after successful fetch", async () => {

        mockAxios.onGet(`/meta/hintr/version`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        await actions.getHintrVersion({commit, rootState} as any);
         
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "HintrVersionFetched", payload: "TEST DATA"});
    });

})