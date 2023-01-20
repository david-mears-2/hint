import {Payload} from "vuex";
import {FilterOption, Error, Warning, VersionInfo} from "./generated";
import {Language} from "./store/translations/locales";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export interface PartialFileUploadProps {
    valid: boolean,
    error: Error | null
    existingFileName: string
}

export interface IndicatorValues {
    value: number,
    color: string
    lower_value?: number
    upper_value?: number
}

export interface BubbleIndicatorValues extends IndicatorValues {
    radius: number
    sizeValue: number
    sizeLower?: number
    sizeUpper?: number
}

export interface LevelLabel {
    id: number
    area_level_label: string
    display: boolean
}

export type Dict<V> = { [k: string]: V }

export type IndicatorValuesDict = Dict<IndicatorValues>;

export type BubbleIndicatorValuesDict = Dict<BubbleIndicatorValues>;

export interface LocalSessionFile {
    hash: string
    filename: string
}

export interface BarchartIndicator {
    indicator: string
    value_column: string
    indicator_column: string
    indicator_value: string
    name: string
    error_low_column: string
    error_high_column: string
    format: string
    scale: number
    accuracy: number | null
}

export interface Filter {
    id: string
    column_id: string
    label: string
    options: FilterOption[]
}

export interface DisplayFilter extends Filter {
    allowMultiple: boolean
}

export interface NumericRange {
    min: number
    max: number
}

export interface Version {
    id: string
    created: string
    updated: string
    versionNumber: number
    note?: string
}

export interface Project {
    id: number
    name: string
    versions: Version[]
    sharedBy?: string
    note?: string,
    uploaded?: boolean
}

export interface CurrentProject {
    project: Project | null
    version: Version | null
}

export interface VersionDetails {
    files: any
    state: string
}

export interface VersionIds {
    projectId: number
    versionId: string
}

export interface DatasetResource {
    id: string
    name: string
    lastModified: string
    metadataModified: string
    url: string
    outOfDate: boolean
}

export interface DatasetResourceSet {
    pjnz: DatasetResource | null
    pop: DatasetResource | null
    program: DatasetResource | null
    anc: DatasetResource | null
    shape: DatasetResource | null
    survey: DatasetResource | null
}

export interface Dataset {
    id: string
    release?: string
    title: string
    url: string
    resources: DatasetResourceSet
    organization: Organization
}

export interface Release {
    id: string
    name: string
    notes: string
    activity_id: string
}

export interface Organization {
    id: string
}

export interface ADRSchemas {
    baseUrl: string
    anc: string
    programme: string
    pjnz: string
    population: string
    shape: string
    survey: string
    outputZip: string
    outputSummary: string
    outputComparison: string
}

export interface UploadFile {
    index: number
    displayName: string
    resourceType: string
    resourceFilename: string
    resourceName: string
    resourceId: string | null
    resourceUrl: string | null
    lastModified: string | null
}

export interface DownloadResultsDependency {
    fetchingDownloadId: boolean
    downloadId: string
    preparing: boolean
    statusPollId: number
    complete: boolean
    downloadError: Error | null
    error: Error | null
    metadataError: Error | null
}

export interface PollingStarted {
    pollId: number,
    downloadType: string
}
export interface SelectedADRUploadFiles {
    summary: any,
    spectrum: any,
    coarseOutput?: any
}

export enum DOWNLOAD_TYPE {
    SPECTRUM = "Spectrum",
    COARSE = "CoarseOutput",
    SUMMARY = "Summary",
    COMPARISON = "Comparison"
}

export interface GenericChartTableConfig {
    columns: GenericChartTableColumnConfig[]
}

export interface GenericChartTableColumnConfig {
    data: {
        columnId: string,
        labelColumn?: string
        hierarchyColumn?: string
        useValueFormat?: boolean
    },
    header: {
        type: "columnLabel" | "selectedFilterOption",
        column: string
    }
}

export interface DatasetConfig {
    id: string
    label: string
    url: string
    filters?: DatasetFilterConfig[],
    table?: GenericChartTableConfig
}

export interface DatasetFilterConfig {
    id: string,
    source: string,
    allowMultiple: boolean
}

export interface DataSourceConfig {
    id: string
    type: "fixed" | "editable"
    label?: string
    datasetId: string
    showFilters: boolean
    showIndicators: boolean
}

export interface GenericChartMetadata {
    datasets: DatasetConfig[]
    dataSelectors: {
        dataSources: DataSourceConfig[]
    }
    subplots?: {
        columns: number
        distinctColumn: string
        heightPerRow: number
        subplotsPerPage: number
    },
    valueFormatColumn?: string
    chartConfig: {
        id: string
        label: string
        description?: string
        config: string
    }[]
}

export interface GenericChartMetadataResponse {
    [key: string]: GenericChartMetadata;
}

export interface GenericChartColumnValue extends FilterOption {
    format?: string | null,
    accuracy?: string | null
}

export interface GenericChartColumn {
    id: string,
    column_id: string,
    label: string,
    values: GenericChartColumnValue[]
}

export interface GenericChartDataset {
    data: Dict<unknown>[],
    metadata: {
        columns: GenericChartColumn[],
        defaults: {
            selected_filter_options: Dict<FilterOption[]>
        }
    },
    warnings: Warning[]
}

export interface StepWarnings {
    modelOptions: Warning[],
    modelRun: Warning[],
    modelCalibrate: Warning[],
    reviewInputs: Warning[]
}

export interface ErrorReportManualDetails {
    section?: string,
    description: string,
    stepsToReproduce: string,
    email: string
}

export interface ErrorReport extends ErrorReportManualDetails {
    country: string,
    projectName: string | undefined,
    browserAgent: string,
    timeStamp: string,
    modelRunId: string,
    calibrateId?: string,
    downloadIds?: DownloadIds
    versions: VersionInfo,
    errors: Error[]
}

export interface TranslatableState {
    language: Language
    updatingLanguage: boolean
}

interface DownloadIds {
    spectrum: string,
    summary: string,
    coarse_output: string
}

export interface UploadImportPayload {
    url: string,
    datasetId: string,
    resourceId: string
}
