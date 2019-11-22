import {mutations} from "../../app/store/filteredData/mutations";
import {
    DataType,
    FilterType,
    initialFilteredDataState,
    SelectedChoroplethFilters
} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";

describe("FilteredData mutations", () => {

    const getSelectedChoroplethFilterByType = (selectedFilters: SelectedChoroplethFilters, filterType: FilterType) => {
        switch (filterType) {
            case (FilterType.Age):
                return selectedFilters.age;
            case (FilterType.Sex):
                return selectedFilters.sex;
            case (FilterType.Survey):
                return selectedFilters.survey;
            case (FilterType.Region):
                return selectedFilters.regions;
            case (FilterType.Year):
                return selectedFilters.year;
        }
    };

    const testChoroplethFilterUpdated = (filterType: FilterType) => {
        const testState = {...initialFilteredDataState()};

        //initial sate
        let expectedInitialState = "" as any;
        if (filterType == FilterType.Region){
            expectedInitialState = [];
        }
        expect(getSelectedChoroplethFilterByType(testState.selectedChoroplethFilters, filterType))
            .toStrictEqual(expectedInitialState);

        mutations.ChoroplethFilterUpdated(testState, {
            payload: [filterType, "test"]
        });
        expect(getSelectedChoroplethFilterByType(testState.selectedChoroplethFilters, filterType))
            .toStrictEqual("test");
    };

    it("sets selectedDataType on SelectedDataTypeUpdated", () => {

        const testState = mockFilteredDataState();
        mutations.SelectedDataTypeUpdated(testState, {
            payload: DataType.Program
        });
        expect(testState.selectedDataType).toBe(DataType.Program);
    });

    it("updates age choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Age);
    });
    it("updates sex choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Sex);
    });
    it("updates survey choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Survey);
    });
    it("updates region choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Region);
    });
    it("updates quarter choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Year);
    });

    it("resets whole state", () => {
        const testState = mockFilteredDataState({
            selectedDataType: DataType.ANC,
            regionIndicators: "TEST" as any
        });
        mutations.Reset(testState);
        expect(testState.selectedDataType).toBe(null);
        expect(testState.regionIndicators).toStrictEqual({});
    })
});
