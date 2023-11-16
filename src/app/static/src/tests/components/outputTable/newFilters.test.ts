import Filters from "../../../app/components/outputTable/NewFilters.vue";
import FilterSelect from "../../../app/components/outputTable/NewFilterSelect.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectFilter} from "../plots/testHelpers";
import { shallowMountWithTranslate } from "../../testHelpers";

const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const props = {
    filters: [
        {
            id: "area", label: "Area", column_id: "area_id", allowMultiple: true,
            options: [{
                id: "MWI", label: "Malawi", children: [
                    {id: "MWI_3_1", label: "3.1"},
                    {id: "MWI_4_1", label: "4.1"},
                    {id: "MWI_4_2", label: "4.2"},
                    {id: "MWI_4_3", label: "4.3"}
                ]
            }
            ]
        },
        {
            id: "age",
            label: "Age",
            column_id: "age",
            allowMultiple: false,
            options: [{id: "0:15", label: "0-15"}, {id: "15:30", label: "15-30"}]
        },
        {
            id: "sex",
            label: "Sex",
            column_id: "sex",
            allowMultiple: false,
            options: [{id: "female", label: "Female"}, {id: "male", label: "Male"}]
        }
    ],
    selectedFilterOptions: {
        age: [{id: "0:15", label: "0-15"}],
        sex: [{id: "female", label: "Female"}],
        area: []
    },
    selectMultipleFilterIds: ["area"]
};

const getWrapper = (customPropsData: any = {}) => {
    return shallowMountWithTranslate(Filters, store, {
        props: {...props, ...customPropsData},
        global: {
            plugins: [store]
        }
    });
};

describe("Filters component", () => {
    it("renders multiple values filter", () => {
        const wrapper = getWrapper();
        expectFilter(wrapper, "filter-area", [], "Area", true, [{
            id: "MWI", label: "Malawi", children: [
                {id: "MWI_3_1", label: "3.1"},
                {id: "MWI_4_1", label: "4.1"},
                {id: "MWI_4_2", label: "4.2"},
                {id: "MWI_4_3", label: "4.3"}
            ]
        } as any
        ], FilterSelect);
    });

    it("renders single value filters", () => {
        const wrapper = getWrapper();

        expectFilter(wrapper, "filter-age", ["0:15"], "Age", false,
            [{id: "0:15", label: "0-15"}, {id: "15:30", label: "15-30"}], FilterSelect);
        expectFilter(wrapper, "filter-sex", ["female"], "Sex", false,
            [{id: "female", label: "Female"}, {id: "male", label: "Male"}], FilterSelect);
    });

    it("can getSelectedFilterValues", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).getSelectedFilterValues("age")).toStrictEqual(["0:15"]);
    });

    it("onFilterSelect updates filter value", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onFilterSelect(props.filters[1], [{id: "15:30", label: "15-30"}]);
        const updates = wrapper.emitted("update:filters")!;
        expect(updates[updates.length - 1][0]).toStrictEqual({
            ...props.selectedFilterOptions,
            age: [{id: "15:30", label: "15-30"}],
        });
    });
});