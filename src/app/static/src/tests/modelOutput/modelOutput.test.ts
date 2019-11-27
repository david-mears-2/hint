import {initialModelOutputState, modelOutputGetters} from "../../app/store/modelOutput/modelOutput";
import {
    mockBaselineState, mockModelOutputState,
    mockModelResultResponse,
    mockModelRunState,
    mockRootState,
    mockShapeResponse
} from "../mocks";


describe("modelOutput module", () => {

    const filters = [
        {id: "age", column_id: "age_group_id", label: "Age", options: []},
        {id: "quarter", column_id: "quarter_id", label: "Quarter", options: []},
        {id: "area", column_id: "area_id", label: "Area", options: [], use_shape_regions: true},
    ];

    const modelRunResponse = mockModelResultResponse({
        plottingMetadata: {
            barchart: {
                filters,
                indicators: [
                    {
                        error_high_column: "upper",
                        error_low_column: "lower",
                        indicator: "prevalence",
                        indicator_column: "indicator_id",
                        indicator_value: "2",
                        name: "Prevalence",
                        value_column: "mean"
                    },
                    {
                        error_high_column: "upper",
                        error_low_column: "lower",
                        indicator: "art_coverage",
                        indicator_column: "indicator_id",
                        indicator_value: "4",
                        name: "ART coverage",
                        value_column: "mean"
                    }
                ]
            },
            choropleth: {
                filters,
                indicators: []
            }

        }
    });

    const rootState = mockRootState({
        baseline: mockBaselineState({
            shape: mockShapeResponse({
                filters: {
                    regions: {
                        label: "label 1",
                        id: "id1",
                        children: []
                    }
                }
            })
        }),
        modelOutput: mockModelOutputState(),
        modelRun: mockModelRunState({
            result: modelRunResponse
        })
    });

    it("gets barchart indicators", async () => {
        const result = modelOutputGetters.barchartIndicators(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(2);
        expect(result).toBe(modelRunResponse.plottingMetadata.barchart.indicators);
    });

    it("gets barchart filters", async () => {

        const result = modelOutputGetters.barchartFilters(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(3);
        expect(result[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "Area",
            use_shape_regions: true,
            options: [
                {id: "id1", label: "label 1", children: []}
            ]
        });
        expect(result[1]).toStrictEqual(modelRunResponse.plottingMetadata.barchart.filters[0]);
        expect(result[2]).toStrictEqual(modelRunResponse.plottingMetadata.barchart.filters[1]);
    });
});