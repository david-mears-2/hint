import {RootState} from "../../root";
import {DataType, FilteredDataState, SelectedChoroplethFilters, SelectedFilters} from "./filteredData";
import {IndicatorRange, Indicators, IndicatorValues} from "../../types";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic";
import {FilterOption} from "../../generated";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const sapState = rootState.surveyAndProgram;
        switch(state.selectedDataType){
            case (DataType.ANC):
                return sapState.anc ? sapState.anc.filters : null;
            case (DataType.Program):
                return sapState.program ? sapState.program.filters : null;
            case (DataType.Survey):
                return sapState.survey ? sapState.survey.filters : null;
            default:
                return null;
        }
    },
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const shape = rootState.baseline && rootState.baseline.shape ? rootState.baseline.shape : null;
        return shape && shape.filters &&
                        shape.filters.regions &&
                        (shape.filters.regions as any).options ? (shape.filters.regions as any).options : [];
    },
    colorFunctions: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
      return {
          art: interpolateWarm,
          prev: interpolateCool
      }
    },
    regionIndicators: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const data =  getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return null;
        }

        const result = {} as {[k: string]: Indicators};
        const artRange = {min: null, max: null} as IndicatorRange;
        const prevRange = {min: null, max: null} as IndicatorRange;

        const updateRange = (r: IndicatorRange, value: number) => {
            if (r.min == null || r.min > value){
                r.min = value;
            }
            if (r.max == null || r.max < value) {
                r.max = value;
            }
        };

        for(const d of data) {
            const row = d as any;

            if (!includeRowForSelectedChoroplethFilters(row, state.selectedDataType, state.selectedChoroplethFilters)) {
                continue;
            }

            const areaId = row.area_id;

            //TODO: This will change when we have a metadata endpoint telling us which column to use as value for each
            //input data type and indicator
            //We will also have to deal will potential multiple values per row
            let indicator: string = "";
            let valueColumn: string = "";
            switch(state.selectedDataType) {
                case (DataType.Survey):
                    indicator = row["indicator"];
                    valueColumn = "est";
                    break;
                case (DataType.Program):
                    indicator = "prev";
                    valueColumn = "current_art";
                    break;
                case (DataType.ANC):
                    indicator = "prev";
                    valueColumn = "ancrt_test_pos";
            }

            const value = row[valueColumn];

            if (!result[areaId]) {
                result[areaId] = {};
            }

            const indicators = result[areaId];
            switch(indicator) {
                case("prev"):
                    indicators.prev = {value: value, color: ""};
                    updateRange(prevRange, indicators.prev!.value);

                    break;
                case("artcov"):
                    indicators.art = {value: value, color: ""};
                    updateRange(artRange, indicators.art!.value);

                    break;

                 //TODO: Also expect recent and vls (viral load suppression) values for survey, need to add these as options
            }
        }
        //Now add the colours - we do this in a second step now, because we are calculating the range as we add the values
        //but once the range comes from the API, we can calculate the colours as we populate the values
        for (const region in result) {
            const indicators = result[region];
            if (indicators.art) {
                indicators.art.color = getColor(indicators.art, artRange, getters.colorFunctions.art);
            }
            if (indicators.prev) {
                indicators.prev.color = getColor(indicators.prev, prevRange, getters.colorFunctions.prev);
            }
        }
        return {
            indicators: result,
            artRange: artRange,
            prevRange: prevRange
        };
    }
};

const getColor = (data: IndicatorValues, range: IndicatorRange, colorFunction: (t: number) => string) => {
    let rangeNum = range.max && range.min && range.max != range.min ? range.max - range.min : 1;
    const colorValue = data!.value / rangeNum;
    return colorFunction(colorValue);
};

export const getUnfilteredData = (state: FilteredDataState, rootState: RootState) => {
    const sapState = rootState.surveyAndProgram;
    switch(state.selectedDataType){
        case (DataType.ANC):
            return sapState.anc ? sapState.anc.data : null;
        case (DataType.Program):
            return sapState.program ? sapState.program.data : null;
        case (DataType.Survey):
            return sapState.survey ? sapState.survey.data : null;
        default:
            return null;
    }
};

const includeRowForSelectedChoroplethFilters = (row: any, dataType: DataType, selectedFilters: SelectedChoroplethFilters) => {

    if (dataType != DataType.ANC && row.sex != selectedFilters.sex!.id) {
        return false;
    }

    if (row.age_group_id != selectedFilters.age!.id) {
        return false;
    }

    if (dataType == DataType.Survey && row.survey_id != selectedFilters.survey!.id) {
        return false;
    }

    return true;
};
