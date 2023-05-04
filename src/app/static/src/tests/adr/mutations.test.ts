import {mockADRState, mockError} from "../mocks";
import {ADRMutation, mutations} from "../../app/store/adr/mutations";

describe("ADR mutations", () => {
    it("can update key", () => {
        const state = mockADRState();
        mutations[ADRMutation.UpdateKey](state, {payload: "new-key"});
        expect(state.key).toBe("new-key");

        mutations[ADRMutation.UpdateKey](state, {payload: null});
        expect(state.key).toBe(null);
    });

    it("can set ssoLogin", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetSSOLogin](state, {payload: true});
        expect(state.ssoLogin).toBe(true);
    });

    it("can set key error", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetKeyError](state, {payload: mockError("whatevs")});
        expect(state.keyError!!.detail).toBe("whatevs");

        mutations[ADRMutation.SetKeyError](state, {payload: null});
        expect(state.keyError).toBe(null);
    });

    it("can set adr error", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetADRError](state, {payload: mockError("whatevs")});
        expect(state.adrError!!.detail).toBe("whatevs");

        mutations[ADRMutation.SetADRError](state, {payload: null});
        expect(state.adrError).toBe(null);
    });

    it("can set datasets", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetDatasets](state, {payload: [1, 2, 3]});
        expect(state.datasets).toEqual([1, 2, 3]);
    });

    it("can set fetching datasets", () => {
        const state = mockADRState({fetchingDatasets: false});
        mutations[ADRMutation.SetFetchingDatasets](state, {payload: true});
        expect(state.fetchingDatasets).toBe(true);
    });

    it("can set releases", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetReleases](state, {payload: [1, 2, 3]});
        expect(state.releases).toEqual([1, 2, 3]);
    });

    it("can clear releases", () => {
        const state = mockADRState({releases: [1, 2, 3]});
        mutations[ADRMutation.ClearReleases](state);
        expect(state.releases).toEqual([]);
    });

    it("can set schemas", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetSchemas](state, {payload: {baseUrl: "adr.com"}});
        expect(state.schemas).toEqual({baseUrl: "adr.com"});
    });

    it("can set user can upload", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetUserCanUpload](state, {payload: true});
        expect(state.userCanUpload).toBe(true);
    });

});
