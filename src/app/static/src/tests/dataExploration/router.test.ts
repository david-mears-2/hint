import {routerDataExploration} from "../../app/router";
import Vuex from "vuex";
import {storeOptions} from "../../app/store/dataExploration/dataExploration";

const baselineActions = {
    getBaselineData: jest.fn()
};

const surveyAndProgramActions = {
    getSurveyAndProgramData: jest.fn()
};

const genericChartActions = {
    getGenericChartMetadata: jest.fn()
};

const actions = {
    getADRSchemas: jest.fn()
};

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.genericChart!!.actions = genericChartActions;
storeOptions.actions = actions

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import { beforeEnterDataExploration } from "../../app/router";
import { mockDataExplorationState } from "../mocks";
import { mount } from "@vue/test-utils";
import HintDataExploration from "../../app/components/HintDataExploration.vue";
import { storeDataExploration } from "../../app/main";
import { RouteLocationNormalized } from "vue-router";
import DataExploration from "../../app/components/dataExploration/DataExploration.vue";
import Accessibility from "../../app/components/Accessibility.vue";

// jest.mock("../../app/components/dataExploration/DataExploration.vue", () => ({
//     name: "DataExploration",
//     template: "<div id='data-exploration-stub'/>"
// }))

// jest.mock("../../app/components/Accessibility.vue", () => ({
//     name: "Accessibility",
//     template: "<div id='accessibility-stub'/>"
// }))



describe("Router", () => {

    afterAll(() => {
        (console.error as jest.Mock).mockClear();
    });

    it("has expected properties", async () => {
        const store = new Vuex.Store({
            state: mockDataExplorationState()
        })
        const mockTranslate = jest.fn()
        const wrapper = mount(HintDataExploration, {
            global: {
                plugins: [routerDataExploration, store],
                stubs: ["data-exploration-header", "errors"],
                directives: {
                    translate: mockTranslate
                },
            },
        })

        await routerDataExploration.push("/");
        await routerDataExploration.isReady();

        expect(wrapper.findComponent(DataExploration).exists()).toBe(true);

        await routerDataExploration.push("/accessibility");
        await routerDataExploration.isReady();

        expect(wrapper.findComponent(Accessibility).exists()).toBe(true);
    });

    it("doesn't redirect returning guest to login page", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        storeDataExploration.state.currentUser = "guest";
        Storage.prototype.getItem = jest.fn((key) => key === "asGuest" ? "continueAsGuest" : null);

        beforeEnterDataExploration({} as RouteLocationNormalized, {} as RouteLocationNormalized);

        expect(window.location.assign).not.toHaveBeenCalled();

        window.location = realLocation
    });

    it("redirects to login page if user is not a returning guest", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        storeDataExploration.state.currentUser = "guest";
        Storage.prototype.getItem = jest.fn();

        beforeEnterDataExploration({} as RouteLocationNormalized, {} as RouteLocationNormalized);

        expect(window.location.assign).toHaveBeenCalledTimes(1);
        expect(window.location.assign).toHaveBeenCalledWith("/login");

        window.location = realLocation
    });

    it("does not redirect to login page for authenticated user", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        storeDataExploration.state.currentUser = "test.user@example.com";

        beforeEnterDataExploration({} as RouteLocationNormalized, {} as RouteLocationNormalized);

        expect(window.location.assign).not.toHaveBeenCalled();
        window.location = realLocation
    });
});
