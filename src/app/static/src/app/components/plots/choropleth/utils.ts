import {Feature} from "geojson";
import {Dict, LevelLabel, NumericRange} from "../../../types";
import {ChoroplethIndicatorMetadata, Filter, FilterOption} from "../../../generated";
import numeral from 'numeral';
import * as d3ScaleChromatic from "d3-scale-chromatic";


export const getFeaturesByLevel = function(features: Feature[], featureLevels: LevelLabel[]) {
    const result = {} as { [k: number]: Feature[] };
    featureLevels.forEach((level: LevelLabel) => {
        result[level.id] = [];
    });
    features.forEach((feature: Feature) => {
        const adminLevel = parseInt(feature.properties!["area_level"]); //Country (e.g. "MWI") is level 0
        if (result[adminLevel]) {
            result[adminLevel].push(feature);
        }
    });
    return result;
};

export const getVisibleFeatures = function(features: Feature[], selectedLevels: FilterOption[], selectedAreas: FilterOption[]) {
    const levels = selectedLevels.map((l: FilterOption) => parseInt(l.id));
    const areas = selectedAreas.map((a: FilterOption) => a.id);
    return features.filter((feature: Feature) => {
        return feature.properties && levels.includes(feature.properties["area_level"]) && areas.includes(feature.properties["area_id"]);
    });
};

export const colorFunctionFromName = function (name: string) {
    let result = (d3ScaleChromatic as any)[name];
    if (!result) {
        //This is trying to be defensive against typos in metadata...
        console.warn(`Unknown color function: ${name}`);
        result = d3ScaleChromatic.interpolateWarm;
    }
    return result;
};

export const roundToContext = function (value: number, context: number[]) {
    //Rounds the value to one more decimal place than is present in the 'context'
    let maxDecPl = 0;
    for (const contextValue of context) {
        const maxFraction = contextValue.toString().split(".");
        const decPl = maxFraction.length > 1 ? maxFraction[1].length : 0;
        maxDecPl = Math.max(maxDecPl, decPl + 1);
    }

    return roundToPlaces(value, maxDecPl);
};

const roundToPlaces = function (value: number, decPl: number) {
    const roundingNum = Math.pow(10, decPl);
    return Math.round(value * roundingNum) / roundingNum;
};

export const formatLegend = function (text: string | number, format: string, scale: number): string {
    text = formatOutput(text, format, scale, null)

    if (typeof (text) === "string" && text.includes(',')) {
        text = text.replace(/,/g, '');
    }
    if (typeof (text) === "string" && !text.includes('%')) {
        text = parseFloat(text)
    }
    if (typeof text == "number") {
        if (text >= 1000 && text < 10000 || text >= 1000000 && text < 10000000) {
            text = numeral(text).format("0.0a")
        } else if (text >= 1000) {
            text = numeral(text).format("0a")
        } else text = text.toString()
    }
    return text
}

export const formatOutput = function (value: number | string, format: string, scale: number | null, accuracy: number | null, roundValue = true) {
    let ans: number

    if (typeof (value) === 'string') {
        ans = parseFloat(value)
    } else ans = value

    if (!format.includes('%') && scale) {
        ans = ans * scale
    }

    if (!format.includes('%') && accuracy && roundValue) {
        /**
         * When accuracy is set to 100 and selected value is less than 200
         * barchart disarranges YAxis. Code below checks if value is greater
         * than 500 before apply 100 scale range. Otherwise, chartJS will
         * automatically use numeric algorithm to calculate scale range.
         * However, if accuracy is less than 100, we simply apply scale range
         * rounding using the given accuracy value.
         */

        if (accuracy > 1) {
            if (ans > 5 * accuracy) {
                ans = Math.round(ans / accuracy) * accuracy
            }
        } else {
            ans = Math.round(ans / accuracy) * accuracy
        }
    }

    if (format) {
        return numeral(ans).format(format)
    } else return ans
};

// export const getIndicatorRange = function (data: any,
//                                            indicatorMeta: ChoroplethIndicatorMetadata,
//                                            filters: Filter[] | null = null,
//                                            selectedFilterValues: Dict<FilterOption[]> | null = null,
//                                            selectedAreaIds: string[] | null = null): NumericRange {
//     let result = {} as NumericRange;
//     iterateDataValues(data, [indicatorMeta], selectedAreaIds, filters, selectedFilterValues,
//         (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
//             if (!result.max) {
//                 result = {min: value, max: value};
//             } else {
//                 result.min = Math.min(result.min, value);
//                 result.max = Math.max(result.max, value);
//             }
//         });
//     return roundRange({
//         min: result ? result.min : 0,
//         max: result ? result.max : 0
//     });
// };

export const roundRange = function (unrounded: NumericRange) {
    //round appropriate to the range magnitude
    let decPl = 0;
    let magnitude = unrounded.max == unrounded.min ? unrounded.min : (unrounded.max - unrounded.min);

    magnitude = magnitude / 100;
    if (magnitude < 1 && magnitude > 0) {
        decPl = Math.trunc(Math.abs(Math.log10(magnitude)));
    }

    return {min: roundToPlaces(unrounded.min, decPl), max: roundToPlaces(unrounded.max, decPl)};
};
