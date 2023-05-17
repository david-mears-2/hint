import {createLocalVue, shallowMount} from '@vue/test-utils';
import MapControl from "../../../app/components/plots/MapControl.vue";
import TreeSelect from "vue3-treeselect";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

describe("Map control component", () => {

    const props = {
        showIndicators: true,
        levelLabels: [
            {id: 4, display: true, area_level_label: "Admin Level 4"},
            {id: 5, display: true, area_level_label: "Admin Level 5"}
        ],
        indicatorsMetadata: [
            {
                indicator: "art_coverage",
                name: "ART coverage"
            },
            {
                indicator: "prevalence",
                name: "Prevalence"
            }
        ]
    };

    it("renders tree selects with expected properties", () => {
        const wrapper = shallowMount(MapControl, {localVue, props, store});

        expect(wrapper.findAllComponents(TreeSelect)[0].props("searchable")).toBe(false);
        expect(wrapper.findAllComponents(TreeSelect)[0].props("multiple")).toBe(false);
        expect(wrapper.findAllComponents(TreeSelect)[0].props("clearable")).toBe(false);

        expect(wrapper.findAllComponents(TreeSelect)[1].props("searchable")).toBe(false);
        expect(wrapper.findAllComponents(TreeSelect)[1].props("multiple")).toBe(false);
        expect(wrapper.findAllComponents(TreeSelect)[1].props("clearable")).toBe(false);
    });

    it("renders indicator options", () => {
        const wrapper = shallowMount(MapControl, {localVue, props, store});

        expect(wrapper.findAllComponents(TreeSelect)[0].props("options"))
            .toStrictEqual([{id: "art_coverage", label: "ART coverage"},
                {id: "prevalence", label: "Prevalence"}]);
    });

    it("renders detail options", () => {
        const wrapper = shallowMount(MapControl, {localVue, props, store});

        expect(wrapper.findAllComponents(TreeSelect)[1].props("options"))
            .toStrictEqual([{id: 4, label: "Admin Level 4"},
                {id: 5, label: "Admin Level 5"}]);
    });


    it("emits indicator-changed event with indicator", () => {
        const wrapper = shallowMount(MapControl, {localVue, props, store});
        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("input", "art_coverage");
        expect(wrapper.emitted("indicator-changed")![0][0]).toBe("art_coverage");
    });

    it("emits detail-changed event with detail", () => {
        const wrapper = shallowMount(MapControl, {localVue, props, store});
        wrapper.findAllComponents(TreeSelect)[1].vm.$emit("input", 3);
        expect(wrapper.emitted("detail-changed")![0][0]).toBe(3);
    });

});
