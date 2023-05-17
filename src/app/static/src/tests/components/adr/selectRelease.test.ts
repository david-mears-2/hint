import {shallowMount} from "@vue/test-utils";
import SelectRelease from "../../../app/components/adr/SelectRelease.vue";
import Vuex from "vuex";
import {ADRMutation} from "../../../app/store/adr/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {mockRootState} from "../../mocks";
import {expectTranslated} from "../../testHelpers";
import TreeSelect from "vue3-treeselect";
import {Language} from "../../../app/store/translations/locales";
import {Dataset} from "../../../app/types";

describe("select release", () => {

    const releasesArray = [
        {
            id: "releaseId",
            name: "releaseName",
            notes: "releaseNotes"
        },
        {
            id: "releaseId2",
            name: "releaseName2",
            notes: null
        }
    ]
    const fakeDataset = {
        id: "datasetId",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        release: "releaseId",
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: null,
            anc: null
        }
    }
    const getReleasesMock = jest.fn();
    const clearReleasesMock = jest.fn();
    
    const getStore = (releases = releasesArray, selectedDataset: Dataset | null = null, getReleases = getReleasesMock) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                adr: {
                    namespaced: true,
                    state: {
                        releases
                    },
                    actions: {
                        getDatasets: jest.fn(),
                        getReleases
                    },
                    mutations: {
                        [ADRMutation.ClearReleases]: clearReleasesMock,
                        [ADRMutation.SetReleases]: jest.fn()
                    }
                },
                baseline: {
                    namespaced: true,
                    state: {
                        selectedDataset
                    }
                }
            }
        });
        registerTranslations(store);
        return store;
    }

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders select release", () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        expect(getReleasesMock.mock.calls.length).toBe(1);
        expect(rendered.findComponent("#selectRelease").exists()).toBe(true);
        expect(rendered.findAllComponents("input").length).toBe(2);
        const labels = rendered.findAllComponents("label")
        expect(labels.length).toBe(3);
        expectTranslated(labels[0], "Use latest data", "Utiliser les dernières données",
            "Use os dados mais recentes", store);
        expectTranslated(labels[1], "Select a release", "Sélectionnez une version",
            "Selecione um lançamento", store);
        expectTranslated(labels[2], "Releases", "Versions",
            "Lançamentos", store);
        expect(rendered.findAllComponents("help-circle-icon-stub").length).toBe(2);
        const select = rendered.findComponent(TreeSelect);
        expect(select.props("multiple")).toBe(false);
        expect(select.props("searchable")).toBe(true);
        expect(rendered.vm.$data.releaseId).toBeUndefined();

        const expectedOptions = [
            {
                id: "releaseId",
                label: "releaseName",
                customLabel: `releaseName
                <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                    releaseNotes<br/>
                </div>`
            },
            {
                id: "releaseId2",
                label: "releaseName2",
                customLabel: `releaseName2
                <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                    
                </div>`
            }
        ]

        expect(select.props("options")).toStrictEqual(expectedOptions);
    });

    it("does not render select release if there are no releases", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore([])});
        rendered.setProps({datasetId: "datasetId"})
        expect(rendered.findComponent("#selectRelease").exists()).toBe(false);
    });

    it("does not render select release if no dataset is selected", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore()});
        expect(rendered.findComponent("#selectRelease").exists()).toBe(false);
    });

    it("does not get releases if dataset id is cleared", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore()});
        rendered.setProps({datasetId: "datasetId"})
        expect(getReleasesMock.mock.calls.length).toBe(1);
        rendered.setProps({datasetId: null})
        expect(getReleasesMock.mock.calls.length).toBe(1);
    });

    it("can render tooltips in English", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        
        const rendered = shallowMount(SelectRelease, {store,
             directives: {"tooltip": mockTooltip} });
        rendered.setProps({datasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Load the latest data, whether it is included in a release (a labelled version) or not");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Load data from a particular labelled version, which may not be the latest data");
    });

    it("can render tooltips in French", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        store.state.language = Language.fr;
        
        const rendered = shallowMount(SelectRelease, {store,
             directives: {"tooltip": mockTooltip} });
        rendered.setProps({datasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Chargez les dernières données, qu'elles soient incluses dans une version (une version étiquetée) ou non");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Charger des données à partir d'une version étiquetée particulière, qui peuvent ne pas être les dernières données");
    });

    it("can render tooltips in Portuguese", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        store.state.language = Language.pt;

        const rendered = shallowMount(SelectRelease, {store,
            directives: {"tooltip": mockTooltip} });
        rendered.setProps({datasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Carregue os dados mais recentes, estejam incluídos em uma versão (uma versão rotulada) ou não");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Carregar dados de uma determinada versão rotulada, que podem não ser os dados mais recentes");
    });

    it("radial toggles whether release tree select is disabled", async () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const select = rendered.findComponent(TreeSelect);
        expect(select.attributes("disabled")).toBe("true");
        const selectRelease = rendered.findAllComponents("input")[1]
        await selectRelease.trigger("change")
        expect(select.attributes("disabled")).toBeUndefined();
    });

    it("radial toggles automatically toggles and selects release if selectedDataset has an appropriate releaseId", () => {
        let store = getStore(releasesArray, fakeDataset)
        const rendered = shallowMount(SelectRelease, {store, props: {datasetId: "datasetId"}});
        const select = rendered.findComponent(TreeSelect);
        expect(select.attributes("disabled")).toBeUndefined();
        expect(rendered.vm.$data.releaseId).toBe("releaseId");
    });

    it("preselect release occurs if releases are updated", () => {
        let store = getStore([releasesArray[1]], fakeDataset)
        const rendered = shallowMount(SelectRelease, {store, props: {datasetId: "datasetId"}});
        const select = rendered.findComponent(TreeSelect);
        expect(select.attributes("disabled")).toBe("true");
        expect(rendered.vm.$data.releaseId).toBeUndefined();
        store.state.adr.releases = releasesArray
        expect(select.attributes("disabled")).toBeUndefined();
        expect(rendered.vm.$data.releaseId).toBe("releaseId");
    });

    it("does not automatically select release if no matching release and reverts to use latest", () => {
        let store = getStore([releasesArray[1]], fakeDataset)
        const rendered = shallowMount(SelectRelease, {store, props: {datasetId: "datasetId", choiceADR: "useRelease"}});
        const select = rendered.findComponent(TreeSelect);
        expect(select.attributes("disabled")).toBe("true");
        expect(rendered.vm.$data.releaseId).toBeUndefined();
    });

    it("changes to datasetId and true open prop triggers getRelease method", () => {
        const spy = jest.fn()
        let store = getStore(releasesArray, null, spy)
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy.mock.calls[0][spy.mock.calls[0].length -2]).toBe("datasetId")
        rendered.setProps({open: true})
        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy.mock.calls[1][spy.mock.calls[1].length -2]).toBe("datasetId")
    });
    

    it("selecting a release emits release id", async () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const selectRelease = rendered.findAllComponents("input")[1]
        await selectRelease.trigger("click")
        rendered.setData({releaseId: "releaseId"})
        expect(rendered.emitted("selected-dataset-release")).toStrictEqual([[undefined], [releasesArray[0]]])
    });

    it("selecting a release emits true valid", async () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const selectRelease = rendered.findAllComponents("input")[1]
        await selectRelease.trigger("change")
        expect(rendered.emitted("valid")).toStrictEqual([[true], [false]])
        rendered.setData({releaseId: "releaseId"})
        expect(rendered.emitted("valid")).toStrictEqual([[true], [false], [true]])
    });

    it("changing datasetId clears releases and resets radial and releaseId", async () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const selectRelease = rendered.findAllComponents("input")[1];
        await selectRelease.trigger("change")
        rendered.setData({releaseId: "releaseId"})
        expect(rendered.vm.$data.releaseId).toBe("releaseId");
        expect(rendered.vm.$data.choiceADR).toBe("useRelease");

        rendered.setProps({datasetId: "datasetId2"})
        expect(clearReleasesMock.mock.calls.length).toBe(2);
        const select = rendered.findComponent(TreeSelect);
        expect(select.attributes("disabled")).toBe("true");
        expect(rendered.vm.$data.releaseId).toBe(undefined);
        expect(rendered.vm.$data.choiceADR).toBe("useLatest");
    });
});
