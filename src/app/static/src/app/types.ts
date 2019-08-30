import {PjnzResponse} from "./generated";
import {GeoJSON} from "geojson";
import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type InternalResponse = BaselineData |  SurveyResponse

export interface BaselineData {
    pjnz: PjnzResponse | null
}

// TODO this will be autogenerated from hintr once added to hintr spec
export interface SurveyResponse {
    filename: string
    data: {
        geoJson: GeoJSON
    }
}
