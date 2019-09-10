import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Filters from "../../app/components/Filters.vue";
import {DataType, FilteredDataState, FilterType} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";
import {RootState} from "../../app/root";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Filters component", () => {

    it("renders filter controls if selected data type", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        expect(wrapper.findAll("treeselect-stub").length).toBe(3);
    });

    it("does not render filter controls if no selected data type", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll("treeselect-stub").length).toBe(0);
    });

    it ("computes hasSelectedDataType when true", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        expect((wrapper as any).vm.hasSelectedDataType).toBe(true);
    });

    it ("computes hasSelectedDataType when false", () => {
        const wrapper = getWrapper();
        expect((wrapper as any).vm.hasSelectedDataType).toBe(false);
    });

    it ("computes available sexFilters for non-ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.viewOptions).toStrictEqual([
            {"id": "female", "label": "female"},
            {"id": "male", "label": "male"},
            {"id": "both", "label": "both"}
            ]);
    });

    it ("computes available sexFilters for ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.ANC});
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.viewOptions).toStrictEqual([
            {"id": "female", "label": "female"}
            ]);
    });

    it ("computes available ageFilters", () => {
        const mockFilterUpdated = jest.fn();
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                age: stateAgeFilterOptions
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const ageFilters = vm.ageFilters;
        expect(ageFilters.available).toStrictEqual(stateAgeFilterOptions);
        expect(ageFilters.viewOptions).toStrictEqual(
            [
                {id: "a1", label: "0-4"},
                {id: "a2", label: "5-9"}
            ]
        );
    });

    it ("computes available surveyFilters", () => {
        //TODO: check computers selected too
        const mockFilterUpdated = jest.fn();
        const stateSurveyFilterOptions = [
            {id: "s1", name: "survey 1"},
            {id: "s2", name: "survey 2"}
        ];
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                surveys: stateSurveyFilterOptions
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const surveyFilters = vm.surveyFilters;
        expect(surveyFilters.available).toStrictEqual(stateSurveyFilterOptions);
        expect(surveyFilters.viewOptions).toStrictEqual(
            [
                {id: "s1", label: "survey 1"},
                {id: "s2", label: "survey 2"}
            ]
        );
    });

    it ("invokes store action when sex filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["female", "both"];
        vm.updateSexFilter(newFilter);

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([FilterType.Sex, [
            {id: "female", name: "female"},
            {id: "both", name: "both"}
        ]]);
    });

    it ("invokes store actions when surveys filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                surveys: [
                                    {id: "s1", name: "survey 1"},
                                    {id: "s2", name: "survey 2"}
                                ]
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["s1"];
        vm.updateSurveyFilter(newFilter);

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([FilterType.Survey, [
            {id: "s1", name: "survey 1"}
        ]]);
    });

    const getWrapper = (state?: Partial<FilteredDataState>, selectedDataFilterOptions: object = {}) => {

        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(state),
                    getters: {
                        selectedDataFilterOptions: () => selectedDataFilterOptions
                    }
                }
            }
        });
        return shallowMount(Filters, {localVue, store});
    };

});