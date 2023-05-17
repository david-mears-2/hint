import Vuex, {ActionTree} from "vuex";
import Vue from "vue";
import {mount, shallowMount} from "@vue/test-utils";
import SelectDataset from "../../../app/components/adr/SelectDataset.vue";
import SelectRelease from "../../../app/components/adr/SelectRelease.vue";
import Modal from "../../../app/components/Modal.vue";
import TreeSelect from "vue3-treeselect"
import {
    mockBaselineState, mockDataExplorationState,
    mockDataset,
    mockDatasetResource,
    mockError,
    mockErrorsState, mockPJNZResponse, mockPopulationResponse,
    mockProjectsState,
    mockRootState,
    mockShapeResponse
} from "../../mocks";
import {BaselineState} from "../../../app/store/baseline/baseline";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {BaselineMutation} from "../../../app/store/baseline/mutations";
import {ADRMutation} from "../../../app/store/adr/mutations";
import {BaselineActions} from "../../../app/store/baseline/actions";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {ADRSchemas} from "../../../app/types";
import {InfoIcon} from "vue-feather";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslatedWithStoreType} from "../../testHelpers";
import {ADRState} from "../../../app/store/adr/adr";
import {getters} from "../../../app/store/dataExploration/getters"
import ResetConfirmation from "../../../app/components/resetConfirmation/ResetConfirmation.vue";
import Mock = jest.Mock;

describe("select dataset", () => {

    const schemas: ADRSchemas = {
        baseUrl: "www.adr.com/",
        anc: "anc",
        programme: "prog",
        pjnz: "pjnz",
        population: "pop",
        shape: "shape",
        survey: "survey",
        outputZip: "zip",
        outputSummary: "summary",
        outputComparison: "comparison"
    }

    const pjnz = {
        id: "1",
        resource_type: schemas.pjnz,
        url: "pjnz.pjnz",
        last_modified: "2020-11-01",
        metadata_modified: "2020-11-02",
        name: "PJNZ resource"
    }
    const shape = {
        id: "2",
        resource_type: schemas.shape,
        url: "shape.geojson",
        last_modified: "2020-11-03",
        metadata_modified: "2020-11-04",
        name: "Shape Resource"
    }
    const pop = {
        id: "3",
        resource_type: schemas.population,
        url: "pop.csv",
        last_modified: "2020-11-05",
        metadata_modified: "2020-11-06",
        name: "Population Resource"
    }
    const survey = {
        id: "4",
        resource_type: schemas.survey,
        url: "survey.csv",
        last_modified: "2020-11-07",
        metadata_modified: "2020-11-08",
        name: "Survey Resource"
    }
    const program = {
        id: "5",
        resource_type: schemas.programme,
        url: "program.csv",
        last_modified: "2020-11-07",
        metadata_modified: "2020-11-08",
        name: "Program Resource"
    }
    const anc = {
        id: "6",
        resource_type: schemas.anc,
        url: "anc.csv",
        last_modified: "2020-11-09",
        metadata_modified: "2020-11-10",
        name: "ANC Resource"
    }

    const fakeRawDatasets = [
        {
            id: "id1",
            title: "Some data",
            organization: {title: "org", id: "org-id"},
            name: "some-data",
            type: "naomi-data",
            resources: []
        },
        {
            id: "id2",
            title: "Some data 2",
            organization: {title: "org", id: "org-id"},
            name: "some-data",
            type: "naomi-data",
            resources: []
        }
    ]

    const fakeDataset = {
        id: "id1",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null
        }
    };

    const fakeDataset2 = {
        id: "id2",
        title: "Some data 2",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                id: "2",
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null
        }
    };
    
    const fakeDatasetWithRelease = {
        id: "id1",
        title: "Some data",
        url: "https://adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        release: "release1",
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null
        }
    };

    const fakeRelease = {
        id: "1.0",
        name: "release1",
        notes: "some notes",
        activity_id: "activityId",
    }

    const setDatasetMock = jest.fn();
    const setReleaseMock = jest.fn();
    const markResourcesUpdatedMock = jest.fn();
    const getDatasetsMock = jest.fn();
    const getReleasesMock = jest.fn();
    const getDatasetMock = jest.fn();

    const baselineActions: Partial<BaselineActions> & ActionTree<any, any> = {
        importShape: jest.fn(),
        importPopulation: jest.fn(),
        importPJNZ: jest.fn(),
        refreshDatasetMetadata: jest.fn(),
        deleteAll: jest.fn()
    }

    const surveyProgramActions: Partial<SurveyAndProgramActions> & ActionTree<any, any> = {
        importSurvey: jest.fn(),
        importProgram: jest.fn(),
        importANC: jest.fn(),
    }

    const mockGetters = {
        editsRequireConfirmation: () => false,
        changesToRelevantSteps: () => [{ number: 4, textKey: "fitModel" }]
    };

    let currentVersion = {id: "version-id", created: "", updated: "", versionNumber: 1}

    const genericModules = (baselineProps: Partial<BaselineState> = {}, adrProps: Partial<ADRState> = {}, requireConfirmation: boolean, baselineGetters = {}) => {
        return {
            adr: {
                namespaced: true,
                state: {
                    schemas: schemas,
                    datasets: fakeRawDatasets,
                    releases: [],
                    ...adrProps
                },
                actions: {
                    getDatasets: getDatasetsMock,
                    getReleases: getReleasesMock,
                    getDataset: getDatasetMock
                },
                mutations: {
                    [ADRMutation.ClearReleases]: jest.fn(),
                    [ADRMutation.SetReleases]: jest.fn()
                }
            },
            baseline: {
                namespaced: true,
                state: mockBaselineState({selectedDataset: null, selectedRelease: null, ...baselineProps}),
                actions: baselineActions,
                mutations: {
                    [BaselineMutation.SetDataset]: setDatasetMock,
                    [BaselineMutation.SetRelease]: setReleaseMock,
                    [BaselineMutation.MarkDatasetResourcesUpdated]: markResourcesUpdatedMock
                },
                getters: {
                    selectedDatasetAvailableResources: () => fakeDataset.resources,
                    ...baselineGetters
                }
            },
            stepper: {
                namespaced: true,
                getters: {...mockGetters, editsRequireConfirmation: () => requireConfirmation}
            },
            errors: {
                namespaced: true,
                state: mockErrorsState(),
            },
            surveyAndProgram: {
                namespaced: true,
                actions: surveyProgramActions
            }
        }
    }

    const getRootStore = (baselineProps: Partial<BaselineState> = {},
        adrProps: Partial<ADRState> = {},
        requireConfirmation: boolean = false,
        baselineGetters = {}) => {

        const store = new Vuex.Store({
            state: mockRootState(),
            getters: getters,
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState({currentProject: {id: 1, name: "v1", versions: []}, currentVersion}),
                    actions: {
                        newVersion: jest.fn()
                    }
                },
                ...genericModules(baselineProps, adrProps, requireConfirmation, baselineGetters)
            }
        });
        registerTranslations(store);
        return store;
    }

    const getStore = (baselineProps: Partial<BaselineState> = {},
        adrProps: Partial<ADRState> = {},
        requireConfirmation: boolean = false,
        baselineGetters = {}) => {

        const store = new Vuex.Store({
            state: mockDataExplorationState(),
            getters: getters,
            modules: genericModules(baselineProps, adrProps, requireConfirmation, baselineGetters)
        });
        registerTranslations(store);
        return store;
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("refreshes selected dataset metdata on mount and sets interval to poll refresh", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect((rendered.vm as any).pollingId).not.toBeNull();
        expect((baselineActions.refreshDatasetMetadata as Mock).mock.calls.length).toBe(1);
        jest.advanceTimersByTime(10000);
        expect((baselineActions.refreshDatasetMetadata as Mock).mock.calls.length).toBe(2);
    });

    it("renders select dataset button when no dataset is selected", () => {
        let store = getStore()
        const rendered = shallowMount(SelectDataset, {store});
        expectTranslatedWithStoreType(rendered.findComponent("button"), "Select ADR dataset",
            "Sélectionner l’ensemble de données ADR", "Selecionar conjunto de dados do ADR", store);
    });

    it("renders edit dataset button when dataset is already selected", () => {
        let store = getStore({
            selectedDataset: fakeDataset
        })
        const rendered = shallowMount(SelectDataset, {store});
        expectTranslatedWithStoreType(rendered.findComponent("button"), "Edit", "Éditer", "Editar", store);
    });

    it("does not render refresh button or info icon when no resources are out of date", () => {
        const rendered = shallowMount(SelectDataset, {
            store: getStore({
                selectedDataset: fakeDataset
            })
        });
        expect(rendered.findAllComponents("button").length).toBe(1);
        expect(rendered.findAllComponents(InfoIcon).length).toBe(0);
    });

    it("shows refresh button and info icon if any resource is out of date", () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true});
        const store = getStore({selectedDataset: fakeDataset});
        const mockTooltipDirective = jest.fn();
        const rendered = mount(SelectDataset, {
            store,
            directives: {"tooltip": mockTooltipDirective},
            stubs: ["tree-select"]
        });
        const buttons = rendered.findAllComponents("button");
        expectTranslatedWithStoreType(buttons[0], "Refresh", "Rafraîchir", "Atualizar", store);
        expectTranslatedWithStoreType(buttons[1], "Edit", "Éditer", "Editar", store);

        expect(rendered.findAllComponents(InfoIcon).length).toBe(1);

        expect(mockTooltipDirective.mock.calls[0][0].innerHTML)
            .toContain("<circle cx=\"12\" cy=\"12\" r=\"10\"></circle>"); // tooltip should be on the icon
        expect(mockTooltipDirective.mock.calls[0][1].value)
            .toBe("The following files have been updated in the ADR: PJNZ. Use the refresh button to import the latest files.");
    });

    it("refreshes out of date baseline files", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"});
        fakeDataset.resources.pop = mockDatasetResource({outOfDate: true, url: "pop.url"});
        fakeDataset.resources.shape = mockDatasetResource({outOfDate: true, url: "shape.url"});

        const store = getStore({selectedDataset: fakeDataset});
        const rendered = shallowMount(SelectDataset, {store, sync: false});
        rendered.findAllComponents("button")[0].trigger("click");
        await Vue.nextTick();
        expect(rendered.findComponent(Modal).props("open")).toBe(true);
        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);
        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.url");
        expect((baselineActions.importPopulation as Mock).mock.calls[0][1]).toBe("pop.url");
        expect((baselineActions.importShape as Mock).mock.calls[0][1]).toBe("shape.url");
    });

    it("marks resources as updated after refreshing", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"})
        const store = getStore({selectedDataset: fakeDataset});
        const rendered = shallowMount(SelectDataset, {store, sync: false});
        rendered.findAllComponents("button")[0].trigger("click");

        await Vue.nextTick();
        await Vue.nextTick();

        expect(markResourcesUpdatedMock.mock.calls.length).toBe(1);
    });

    it("refresh stops and starts polling for dataset metadata changes", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"})
        const store = getStore({selectedDataset: fakeDataset});
        const rendered = shallowMount(SelectDataset, {store, sync: false});

        const oldPollingId = (rendered.vm as any).pollingId;
        const clearIntervalSpy = jest.spyOn(window, "clearInterval");
        const setIntervalSpy = jest.spyOn(window, "setInterval");

        rendered.findAllComponents("button")[0].trigger("click");

        await Vue.nextTick();
        await Vue.nextTick();

        expect(clearIntervalSpy.mock.calls[0][0]).toBe(oldPollingId);
        expect(setIntervalSpy.mock.calls[0][0]).toBe((rendered.vm as any).refreshDatasetMetadata);
        expect(setIntervalSpy.mock.calls[0][1]).toBe(10000);
        expect((rendered.vm as any).pollingId).not.toBe(oldPollingId);
    });

    it("renders modal and spinner while refreshing", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"})
        const store = getStore({selectedDataset: fakeDataset});
        const rendered = shallowMount(SelectDataset, {store, sync: false});
        rendered.findAllComponents("button")[0].trigger("click");

        await Vue.nextTick();

        expect(rendered.findComponent(Modal).props("open")).toBe(true);
        expect(rendered.findComponent("#loading-dataset").findAllComponents(LoadingSpinner).length).toBe(1);
        expect(rendered.findComponent("#fetch-error").exists()).toBe(false);

        await Vue.nextTick();
        await Vue.nextTick();

        expect(rendered.findComponent(Modal).props("open")).toBe(false);
        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
    });

    it("renders message and button on error fetching datasets", async () => {
        const store = getStore({}, {adrError: mockError("test error")});
        const rendered = shallowMount(SelectDataset, {store});
        rendered.findAllComponents("button")[0].trigger("click");

        await Vue.nextTick();

        const modal = rendered.findComponent(Modal);
        expect(modal.props("open")).toBe(true);
        expectTranslatedWithStoreType(modal.findComponent("#fetch-error div"),
            "There was an error fetching datasets from ADR",
            "Une erreur s'est produite lors de la récupération des ensembles de données à partir d'ADR",
            "Ocorreu um erro ao obter conjuntos de dados do ADR", store);
        expectTranslatedWithStoreType(modal.findComponent("#fetch-error button"), "Try again", "Réessayer",
            "Tente novamente", store);
    });

    it("Try again button invokes getDatasets action", async () => {
        const store = getStore({}, {adrError: mockError("test error")});
        const rendered = shallowMount(SelectDataset, {store});
        rendered.findAllComponents("button")[0].trigger("click");

        await Vue.nextTick();
        expect(getDatasetsMock.mock.calls.length).toBe(0);
        rendered.findComponent("#fetch-error button").trigger("click");

        await Vue.nextTick();
        expect(getDatasetsMock.mock.calls.length).toBe(1);
    });


    it("refreshes survey & program files if any baseline file is refreshed and pre-existing shape file present",
        async () => {
            const fakeDataset = mockDataset();
            fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"});
            fakeDataset.resources.survey = mockDatasetResource({url: "survey.url"});
            fakeDataset.resources.program = mockDatasetResource({url: "program.url"});
            fakeDataset.resources.anc = mockDatasetResource({url: "anc.url"});
            const store = getStore({selectedDataset: fakeDataset, shape: mockShapeResponse()});
            const rendered = shallowMount(SelectDataset, {store, sync: false});
            rendered.findAllComponents("button")[0].trigger("click");
            await Vue.nextTick();
            await Vue.nextTick();
            await Vue.nextTick();
            expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.url");
            expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.url");
            expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.url");
        });

    it("refreshes survey & program files if any baseline file is refreshed and shape file included in resources",
        async () => {
            const fakeDataset = mockDataset();
            fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"});
            fakeDataset.resources.survey = mockDatasetResource({url: "survey.url"});
            fakeDataset.resources.program = mockDatasetResource({url: "program.url"});
            fakeDataset.resources.anc = mockDatasetResource({url: "anc.url"});
            fakeDataset.resources.shape = mockDatasetResource();
            const store = getStore({selectedDataset: fakeDataset});
            const rendered = shallowMount(SelectDataset, {store, sync: false});
            rendered.findAllComponents("button")[0].trigger("click");
            await Vue.nextTick();
            await Vue.nextTick();
            await Vue.nextTick();
            expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.url");
            expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.url");
            expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.url");
        });

    it("refreshes survey & program files if out of date",
        async () => {
            const fakeDataset = mockDataset();
            fakeDataset.resources.survey = mockDatasetResource({url: "survey.url", outOfDate: true});
            fakeDataset.resources.program = mockDatasetResource({url: "program.url", outOfDate: true});
            fakeDataset.resources.anc = mockDatasetResource({url: "anc.url", outOfDate: true});
            fakeDataset.resources.shape = mockDatasetResource();
            const store = getStore({ selectedDataset: fakeDataset });
            const rendered = shallowMount(SelectDataset, {store, sync: false});
            rendered.findAllComponents("button")[0].trigger("click");
            await Vue.nextTick();
            await Vue.nextTick();
            await Vue.nextTick();
            expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.url");
            expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.url");
            expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.url");
        });

    it("renders selected dataset if it exists", () => {
        let store = getStore({
            selectedDataset: fakeDataset
        })
        const rendered = shallowMount(SelectDataset, {store});
        expectTranslatedWithStoreType(rendered.findComponent(".font-weight-bold"), "Selected dataset:",
            "Ensemble de données sélectionné :", "Conjunto de dados selecionado:", store);
        expect(rendered.findComponent("a").text()).toBe("Some data");
        expect(rendered.findComponent("a").attributes("href")).toBe("www.adr.com/naomi-data/some-data");
    });

    it("renders selected dataset and selected release with url pointing to release's activity page", () => {
        let store = getStore({
            selectedDataset: fakeDatasetWithRelease,
            selectedRelease: fakeRelease
        })
        const rendered = shallowMount(SelectDataset, {store});
        expectTranslatedWithStoreType(rendered.findComponent(".font-weight-bold"), "Selected dataset:",
            "Ensemble de données sélectionné :", "Conjunto de dados selecionado:", store);

        expect(rendered.findComponent("a").text()).toBe("Some data — release1");
        expect(rendered.findComponent("a").attributes("href")).toBe("https://adr.com/dataset/id1?activity_id=activityId");
    });

    it("does not render selected dataset if it doesn't exist", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect(rendered.findAllComponents("#selectedDatasetSpan").length).toBe(0);
        expect(rendered.findAllComponents("a").length).toBe(0);
    });

    it("can open modal", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
        rendered.findComponent("button").trigger("click");
        expect(rendered.findComponent(Modal).props("open")).toBe(true);
    });

    it("can close modal", () => {
        const rendered = mount(SelectDataset, {store: getStore(), stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");
        expect(rendered.findComponent(Modal).props("open")).toBe(true);
        rendered.findComponent(Modal).findAllComponents("button")[1].trigger("click");
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("renders select", async () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        rendered.findComponent("button").trigger("click");
        const select = rendered.findComponent(TreeSelect);
        expect(select.props("multiple")).toBe(false);
        expect(select.props("searchable")).toBe(true);

        const expectedOptions = [
            {
                id: "id1",
                label: "Some data",
                customLabel: `Some data
                        <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                            (some-data)<br/>
                            <span class="font-weight-bold">org</span>
                        </div>`
            },
            {
                id: "id2",
                label: "Some data 2",
                customLabel: `Some data 2
                        <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                            (some-data)<br/>
                            <span class="font-weight-bold">org</span>
                        </div>`
            }
        ]

        expect(select.props("options")).toStrictEqual(expectedOptions);
    });

    it("hides fetching dataset controls, and enables TreeSelect, when not fetching", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect(rendered.findComponent("#fetching-datasets").classes()).toStrictEqual(["invisible"]);
        expect(rendered.findComponent(TreeSelect).attributes("disabled")).toBeUndefined();
    });

    it("shows fetching dataset controls, and disables TreeSelect, when fetching", () => {
        const store = getStore({}, {fetchingDatasets: true});
        const rendered = shallowMount(SelectDataset, {store});
        expect(rendered.findComponent("#fetching-datasets").classes()).toStrictEqual(["visible"]);
        expect(rendered.findComponent(TreeSelect).attributes("disabled")).toBe("true");

        expect(rendered.findComponent("#fetching-datasets").findComponent(LoadingSpinner).attributes("size")).toBe("xs");
        expectTranslatedWithStoreType(rendered.findComponent("#fetching-datasets span"),
            "Loading datasets", "Chargement de vos ensembles de données", "A carregar conjuntos de dados", store);
    });

    it("sets current dataset", async () => {
        let store = getStore({selectedDataset: fakeDataset2});
        const rendered = mount(SelectDataset, {
            store,
            stubs: ["tree-select"]
        });
        expect(rendered.vm.$data.newDatasetId).toBe(null);
        // open modal
        rendered.findComponent("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        expect(rendered.findComponent(Modal).findAllComponents("button").length).toBe(2);
        expect(rendered.findAllComponents("p").length).toBe(0);

        expectTranslatedWithStoreType(rendered.findComponent("h4"), "Browse ADR", "Parcourir ADR", "Procurar no ADR", store);
        expectTranslatedWithStoreType(rendered.findComponent("div > label"), "Datasets", "Ensembles de données",
            "Conjuntos de dados", store);

        // dataset is preselected in dropdown and click button to import
        expect(rendered.vm.$data.newDatasetId).toBe("id2");
        const selectRelease = rendered.findComponent(SelectRelease)
        await selectRelease.vm.$emit("selected-dataset-release", fakeRelease);
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();
        expect(rendered.findComponent("#loading-dataset").findComponent(LoadingSpinner).exists()).toBe(true);
        expect(rendered.findAllComponents(TreeSelect).length).toBe(0);
        expect(rendered.findComponent(Modal).findAllComponents("button").length).toBe(0);
        expect(rendered.findAllComponents("h4").length).toBe(0);
        expectTranslatedWithStoreType(rendered.findComponent("p"),
            "Importing files - this may take several minutes. Please do not close your browser.",
            "Importation de fichiers - cela peut prendre plusieurs minutes. Veuillez ne pas fermer votre navigateur.",
            "Importação de ficheiros - isto pode demorar vários minutos. Por favor, não feche o seu navegador.",
            store);

        expect(getDatasetMock.mock.calls[0][1].id).toBe("id2");
        expect(getDatasetMock.mock.calls[0][1].release).toBe(fakeRelease);

        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("current dataset is not preselected if there is no selectedDataset", async () => {
        let store = getStore({});
        const rendered = mount(SelectDataset, {
            store,
            stubs: ["tree-select"]
        });
        
        rendered.findComponent("button").trigger("click");
        expect(rendered.vm.$data.newDatasetId).toBe(null);
    });

    it("current dataset is preselected if datasets change", async () => {
        let store = getStore({selectedDataset: fakeDataset2});
        const rendered = mount(SelectDataset, {
            store,
            stubs: ["tree-select"]
        });
        store.state.adr.datasets = [fakeRawDatasets[0]]
        
        rendered.findComponent("button").trigger("click");
        expect(rendered.vm.$data.newDatasetId).toBe(null);
        store.state.adr.datasets = fakeRawDatasets
        expect(rendered.vm.$data.newDatasetId).toBe("id2");
    });

    it("renders select release", async () => {
        let store = getStore({},
            {datasets: [{...fakeRawDatasets[0], ...fakeRawDatasets[1], resources: [shape]}]}
        )
        const rendered = mount(SelectDataset, {
            store, stubs: ["tree-select"]
        });
        await rendered.findComponent("button").trigger("click");

        rendered.setData({newDatasetId: "id2"});
        const selectRelease = rendered.findComponent(SelectRelease)
        expect(selectRelease.props("datasetId")).toBe("id2");
        expect(selectRelease.props("open")).toBe(true);
    });

    it("select release emits valid and enables import button", async () => {
        let store = getStore({},
            {datasets: [{...fakeRawDatasets[0], ...fakeRawDatasets[1], resources: [shape]}]}
        )
        const rendered = mount(SelectDataset, {
            store, stubs: ["tree-select"]
        });
        await rendered.findComponent("button").trigger("click");

        rendered.setData({newDatasetId: "id2", valid: false});
        const selectRelease = rendered.findComponent(SelectRelease)
        const importBtn = rendered.findComponent("#importBtn")
        expect(importBtn.attributes("disabled")).toBe("disabled");
        await selectRelease.vm.$emit("valid", true);
        expect(importBtn.attributes("disabled")).toBeUndefined();
    });

    it("select release emits selected dataset release and updates release", async () => {
        let store = getStore({},
            {datasets: [{...fakeRawDatasets[0], ...fakeRawDatasets[1], resources: [shape]}]}
        )
        const rendered = mount(SelectDataset, {
            store, stubs: ["tree-select"]
        });
        await rendered.findComponent("button").trigger("click");

        rendered.setData({newDatasetId: "id2"});
        const selectRelease = rendered.findComponent(SelectRelease)
        await selectRelease.vm.$emit("selected-dataset-release", fakeRelease);
        expect(rendered.vm.$data.newDatasetRelease).toStrictEqual(fakeRelease)
    });
    
    it("renders reset confirmation dialog when importing a new dataset and then saves new version and imports if click save", async () => {
        let store = getRootStore({selectedDataset: fakeDataset2}, {}, true);
        const rendered = mount(SelectDataset, {
            store, stubs: ["tree-select"]
        });
        const editBtn = rendered.findComponent("button")
        editBtn.trigger("click");
        expect(rendered.findComponent(Modal).props("open")).toBe(true);
        rendered.setData({newDatasetId: "id2"});
        const importBtn = rendered.findComponent(Modal).findComponent("button")
        importBtn.trigger("click");
        expect(rendered.findComponent(ResetConfirmation).props("open")).toBe(true);
        const saveBtn = rendered.findComponent(ResetConfirmation).findComponent("button");
        expectTranslatedWithStoreType(saveBtn, "Save version and keep editing",
            "Sauvegarder la version et continuer à modifier", "Guardar versão e continuar a editar",
            store);
        saveBtn.trigger("click");
        store.state.projects.currentVersion = {id: "id1"} as any;
        expect(rendered.findComponent(ResetConfirmation).exists()).toBe(false);
        expect(rendered.findComponent("#loading-dataset").findComponent(LoadingSpinner).exists()).toBe(true);
        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("renders reset confirmation dialog when changing selected dataset and closes if click cancel", async () => {
        let store = getRootStore({selectedDataset: fakeDataset}, {}, true);
        const rendered = mount(SelectDataset, {
            store, stubs: ["tree-select"]
        });
        const editBtn = rendered.findComponent("button")
        await editBtn.trigger("click");
        expect(rendered.findComponent(Modal).props("open")).toBe(true);
        rendered.setData({newDatasetId: "id2"});
        const importBtn = rendered.findComponent(Modal).findComponent("button")
        await importBtn.trigger("click");
        expect(rendered.findComponent(ResetConfirmation).props("open")).toBe(true);
        const cancelBtn = rendered.findComponent(ResetConfirmation).findAllComponents("button")[1];
        expectTranslatedWithStoreType(cancelBtn, "Cancel editing",
            "Annuler l'édition", "Cancelar edição", store);
        await cancelBtn.trigger("click");
        expect(rendered.findComponent(ResetConfirmation).exists()).toBe(false);
        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("imports baseline files if they exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    pjnz: mockDatasetResource(pjnz),
                    pop: mockDatasetResource(pop),
                    shape: mockDatasetResource(shape)
                }
            }
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"})
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();

        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.pjnz");
        expect((baselineActions.importPopulation as Mock).mock.calls[0][1]).toBe("pop.csv");
        expect((baselineActions.importShape as Mock).mock.calls[0][1]).toBe("shape.geojson");

        await Vue.nextTick(); // once for baseline actions to return
        await Vue.nextTick(); // once for survey actions to return

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("imports baseline files does not trigger confirmation dialog when on data exploration mode", async () => {
        const store = getStore({}, {}, true, {
            selectedDatasetAvailableResources: () => {
                return {
                    pjnz: mockDatasetResource(pjnz),
                    pop: mockDatasetResource(pop),
                    shape: mockDatasetResource(shape)
                }
            }
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"})
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();

        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.pjnz");
        expect((baselineActions.importPopulation as Mock).mock.calls[0][1]).toBe("pop.csv");
        expect((baselineActions.importShape as Mock).mock.calls[0][1]).toBe("shape.geojson");

        await Vue.nextTick(); // once for baseline actions to return
        await Vue.nextTick(); // once for survey actions to return

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("does not import baseline file if it doesn't exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    pjnz: mockDatasetResource(pjnz)
                }
            }
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"});
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();

        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.pjnz");
        expect((baselineActions.importPopulation as Mock).mock.calls.length).toBe(0);
        expect((baselineActions.importShape as Mock).mock.calls.length).toBe(0);

        await Vue.nextTick();
        // await just one tick for baseline actions to return, survey actions will not fire
        // because shape is not present

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("does not import baseline file if user does not have permission (ie, relevant dataset in datasets has no resources)", async () => {
        const store = getStore(
            {}, {}, false,
            {
                selectedDatasetAvailableResources: () => {
                    return {}
                }
            }
        );
        const rendered = mount(SelectDataset, { store, stubs: ["tree-select"] });
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({ newDatasetId: "id1" })
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();

        expect((baselineActions.importPJNZ as Mock).mock.calls.length).toBe(0);
        expect((baselineActions.importPopulation as Mock).mock.calls.length).toBe(0);
        expect((baselineActions.importShape as Mock).mock.calls.length).toBe(0);

        await Vue.nextTick(); // once for baseline actions to return
        await Vue.nextTick(); // once for survey actions to return

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("imports survey and program files if they exist and shape file exists", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    shape: mockDatasetResource(shape),
                    survey: mockDatasetResource(survey),
                    program: mockDatasetResource(program),
                    anc: mockDatasetResource(anc)
                }
            }
        });

        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"});
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.csv");
        expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.csv");
        expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.csv");

        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("does not import survey and program file if it doesn't exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    shape: mockDatasetResource(shape),
                    survey: mockDatasetResource(survey)
                }
            }
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"});
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.csv");
        expect((surveyProgramActions.importProgram as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importANC as Mock).mock.calls.length).toBe(0);

        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("does not import any survey and program files if shape file doesn't exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                        survey: mockDatasetResource(survey),
                        program: mockDatasetResource(program),
                    anc: mockDatasetResource(anc)
                }
            }
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"});
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importProgram as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importANC as Mock).mock.calls.length).toBe(0);

        await Vue.nextTick();
        // await just one tick for baseline actions to return, survey actions will not fire
        // because shape is not present

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("imports survey and program files if pre-existing shape file is present", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    shape: mockDatasetResource(shape),
                    survey: mockDatasetResource(survey),
                    program: mockDatasetResource(program),
                    anc: mockDatasetResource(anc)
                }
            }
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});

        rendered.findComponent("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"});
        rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();
        await Vue.nextTick();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.csv");
        expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.csv");
        expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.csv");

        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
    });

    it("stops polling dataset metadata on beforeDestroy", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        const pollingId = (rendered.vm as any).pollingId;
        const spy = jest.spyOn(window, "clearInterval");
        rendered.unmount();
        expect(spy.mock.calls[0][0]).toBe(pollingId);
    });

    it("renders can not save when button is disabled", async () => {
        const store = getStore({}, {
            datasets: [{...fakeRawDatasets[0], resources: [shape, survey]}]
        });
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.findComponent("button").trigger("click");
        await Vue.nextTick();

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: ""});

        expect(rendered.findComponent(Modal).findComponent("button").attributes("disabled")).toBe("disabled");
    });

    it("does not start polling if release is selected", async () => {
        const store = getStore(
            {
                selectedDataset: {
                    ...fakeDatasetWithRelease
                }
            }
        );

        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        const clearInterval = jest.spyOn(window, "clearInterval");
        const setInterval = jest.spyOn(window, "setInterval");

        rendered.findComponent("button").trigger("click");

        const treeSelect = rendered.findComponent(TreeSelect)
        expect(treeSelect.exists()).toBe(true);
        treeSelect.vm.$emit("select", "id1")

        await rendered.findComponent(Modal).findComponent("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
        expect(clearInterval.mock.calls.length).toBe(0);
        expect(setInterval.mock.calls.length).toBe(0);

    });

    it("starts polling for update if selected dataset is not release", async () => {
        const store = getStore(
            {
                selectedDataset: {
                    ...fakeDataset
                }
            }
        );

        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        const clearInterval = jest.spyOn(window, "clearInterval");
        const setInterval = jest.spyOn(window, "setInterval");
        const pollingId = (rendered.vm as any).pollingId;

        rendered.findComponent("button").trigger("click");

        const treeSelect = rendered.findComponent(TreeSelect)
        expect(treeSelect.exists()).toBe(true);
        treeSelect.vm.$emit("select", "id1")

        await rendered.findComponent(Modal).findComponent("button").trigger("click");

        await Vue.nextTick();
        await Vue.nextTick();
        await Vue.nextTick();

        expect(rendered.findComponent("#loading-dataset").exists()).toBe(false);
        expect(rendered.findComponent(Modal).props("open")).toBe(false);
        expect(clearInterval.mock.calls[0][0]).toBe(pollingId);
        expect(setInterval.mock.calls[0][0]).toBe((rendered.vm as any).refreshDatasetMetadata);
        expect(setInterval.mock.calls[0][1]).toBe(10000);
    });

    it("deletes previously imported files if population file exist", async () => {

        const baselineProp = {
            population: mockPopulationResponse()
        }

        await testDeleteImportedFiles(baselineProp);
    });

    it("deletes previously imported files if shape file exist", async () => {

        const baselineProp = {
            shape: mockShapeResponse()
        }

        await testDeleteImportedFiles(baselineProp);
    });

    it("deletes previously imported files if pjnz file exist", async () => {

        const baselineProp = {
            pjnz: mockPJNZResponse()
        }

        await testDeleteImportedFiles(baselineProp);
    });

    it("does not delete previously imported files if it does not exist", async () => {
        const store = getStore(
            {
                shape: null,
                pjnz: null,
                population: null,
                selectedDataset: {
                    ...fakeDataset,
                    resources: {} as any
                }
            }, {}
        );

        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        await rendered.findComponent("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"})
        await rendered.findComponent(Modal).findComponent("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);
        expect((baselineActions.deleteAll as Mock)).not.toHaveBeenCalled()
    });

    const testDeleteImportedFiles = async (baselineProps: Partial<BaselineState>) => {
        const store = getStore(
            {
                shape: null,
                pjnz: null,
                population: null,
                selectedDataset: {
                    ...fakeDataset,
                    resources: {} as any
                },
                ...baselineProps,
            }
        );

        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        await rendered.findComponent("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"})
        await rendered.findComponent(Modal).findComponent("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);
        expect((baselineActions.deleteAll as Mock)).toHaveBeenCalled()
    }

});
