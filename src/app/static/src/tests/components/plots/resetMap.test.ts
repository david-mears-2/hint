import {createLocalVue, shallowMount} from "@vue/test-utils";
import ResetMap from "../../../app/components/plots/ResetMap.vue";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";
import Vuex from "vuex";
import {LControl} from "@vue-leaflet/vue-leaflet";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const getWrapper = () => {
    return shallowMount(ResetMap, {store, localVue});
};

describe("ResetMap component", () => {

    it("render can display button on map and emit reset view when button clicked", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAllComponents(LControl).length).toBe(1)
        const button = wrapper.findComponent(LControl).findComponent('div').findComponent('a')
        expectTranslated(button, 'Reset view', 'Réinitialiser la vue',
            "Repor vista", store, "aria-label");
        expectTranslated(button, 'Reset view', 'Réinitialiser la vue',
            "Repor vista", store, "title");
        
        button.trigger("click")
        expect(wrapper.emitted("reset-view")!).toBeTruthy();
    });

});
