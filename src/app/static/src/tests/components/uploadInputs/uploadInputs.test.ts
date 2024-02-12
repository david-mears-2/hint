import Vuex, {Store} from 'vuex';
import {BaselineActions} from "../../../app/store/baseline/actions";
import {
    mockBaselineState,
    mockError,
    mockMetadataState,
    mockPopulationResponse,
    mockRootState,
    mockShapeResponse,
    mockStepperState,
    mockSurveyAndProgramState
} from "../../mocks";
import {BaselineState} from "../../../app/store/baseline/baseline";
import UploadInputs from "../../../app/components/uploadInputs/UploadInputs.vue";
import ManageFile from "../../../app/components/files/ManageFile.vue";
import {MetadataState} from "../../../app/store/metadata/metadata";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslatedWithStoreType, mountWithTranslate, shallowMountWithTranslate} from "../../testHelpers";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {getters} from "../../../app/store/surveyAndProgram/getters";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {testUploadComponent} from "./fileUploads";
import {RootState} from "../../../app/root";

describe("UploadInputs upload component", () => {

    let actions: jest.Mocked<BaselineActions>;
    let mutations = {};

    let sapActions: jest.Mocked<SurveyAndProgramActions>;
    let sapMutations = {};

    const mockStepperGetters = {
        editsRequireConfirmation: () => true,
        changesToRelevantSteps: () => [{number: 4, textKey: "fitModel"}]
    };

    testUploadComponent("surveys", 3);
    testUploadComponent("program", 4);
    testUploadComponent("anc", 5);

    const createSut = (baselineState?: Partial<BaselineState>,
                       metadataState?: Partial<MetadataState>,
                       surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey}) => {

        actions = {
            refreshDatasetMetadata: jest.fn(),
            importPJNZ: jest.fn(),
            importPopulation: jest.fn(),
            importShape: jest.fn(),
            getBaselineData: jest.fn(),
            uploadPJNZ: jest.fn(),
            uploadShape: jest.fn(),
            uploadPopulation: jest.fn(),
            deletePJNZ: jest.fn(),
            deleteShape: jest.fn(),
            deletePopulation: jest.fn(),
            deleteAll: jest.fn(),
            validate: jest.fn()
        };

        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                stepper: {
                    namespaced: true,
                    getters: mockStepperGetters
                },
                errors: {
                    namespaced: true
                },
                projects: {
                    namespaced: true,
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                    actions: {...actions},
                    mutations: {...mutations}
                },
                metadata: {
                    namespaced: true,
                    state: mockMetadataState(metadataState)
                },
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    mutations: {...sapMutations},
                    actions: {...sapActions},
                    getters: getters
                }
            },
            getters: {
                isGuest: () => false
            }
        });

        registerTranslations(store);
        return store;
    };

    it("pjnz upload accepts pjnz or zip files", () => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props().accept).toBe("PJNZ,pjnz,.pjnz,.PJNZ,.zip,zip,ZIP,.ZIP");
    });

    it("shows required text in front of pjnz upload label", () => {
        const store = createSut({}, {}, {});
        expectFileIsRequired(store, 0)
    });

    it("shows required text in front of area file upload label", () => {
        const store = createSut({}, {}, {});
        expectFileIsRequired(store, 1)
    });


    it("shows required text in front of population upload label", () => {
        const store = createSut({}, {}, {});
        expectFileIsRequired(store, 2)
    });


    it("shows required text in front of survey upload label", () => {
        const store = createSut({}, {}, {});
        expectFileIsRequired(store, 3)
    });

    it("does not show required text in front of ART upload", () => {
        const store = createSut();
        expectFileIsNotRequired(store, 4)
    });


    it("does not show required text in front of ANC upload label", () => {
        const store = createSut();
        expectFileIsNotRequired(store, 5)
    });


    it("pjnz is not valid if country is not present", () => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props().valid).toBe(false);
        expect(wrapper.findAllComponents(ManageFile)[0].findAll("label").length).toBe(0);
    });

    it("pjnz is valid if country is present", () => {
        const store = createSut({country: "Malawi"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props().valid).toBe(true);
    });

    it("country name is passed to file upload component if country is present", async () => {
        const store = createSut({country: "Malawi"});
        const wrapper = mountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        await expectTranslatedWithStoreType(wrapper.findAllComponents(ManageFile)[0].findAll("label")[1],
            "Country: Malawi", "Pays: Malawi", "País: Malawi", store);
    });

    it("passes pjnz error to file upload", () => {
        const error = mockError("File upload went wrong");
        const store = createSut({pjnzError: error});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props().error).toStrictEqual(error);
    });

    it("shows metadata error if present", () => {
        const plottingMetadataError = mockError("Metadata went wrong");
        const store = createSut({}, {plottingMetadataError});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props().error).toStrictEqual(plottingMetadataError);
    });

    it("shows pjnz error, not metadata error, if both are present", () => {
        const pjnzError = mockError("File upload went wrong");
        const plottingMetadataError = mockError("Metadata went wrong");
        const store = createSut({pjnzError}, {plottingMetadataError});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props().error).toStrictEqual(pjnzError);
    });

    it("shows baseline error if present", () => {
        const error = mockError("Baseline is inconsistent");
        const store = createSut({baselineError: error});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findComponent(ErrorAlert).props().error).toStrictEqual(error)
    });

    it("shows baseline validating indicator", async () => {
        const store = createSut({validating: true});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        const validating = wrapper.find("#upload-inputs-validating");
        await expectTranslatedWithStoreType(validating.find("span"), "Validating...",
            "Validation en cours...", "A validar...", store);
        expect(validating.findAllComponents(LoadingSpinner).length).toEqual(1)
    });

    it("shape is not valid if shape is not present", () => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[1].props().valid).toBe(false);
    });

    it("shape is valid if shape is present", () => {
        const store = createSut({shape: mockShapeResponse()});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[1].props().valid).toBe(true);
    });

    it("passes shape error to file upload", () => {
        const error = mockError("File upload went wrong");
        const store = createSut({shapeError: error});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[1].props().error).toStrictEqual(error);
    });

    it("shape upload accepts geojson", () => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[1].props().accept).toBe("geojson,.geojson,GEOJSON,.GEOJSON");
    });

    it("population is not valid if population is not present", () => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[2].props().valid).toBe(false);
    });

    it("population is valid if population is present", () => {
        const store = createSut({population: mockPopulationResponse()});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[2].props().valid).toBe(true);
    });

    it("passes population error to file upload", () => {
        const error = mockError("File upload went wrong")
        const store = createSut({populationError: error});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[2].props().error).toStrictEqual(error);
    });

    it("population upload accepts csv", () => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[2].props().accept).toBe("csv,.csv");
    });

    it("passes pjnz response existing file name to manage file", () => {
        const store = createSut({pjnz: {filename: "existing file"} as any});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props("existingFileName")).toBe("existing file");
    });

    it("passes pjnz errored file to manage file", () => {
        const store = createSut({pjnzErroredFile: "errored file"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[0].props("existingFileName")).toBe("errored file");
    });

    it("passes shape response existing file name to manage file", () => {
        const store = createSut({shape: {filename: "existing file"} as any});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[1].props("existingFileName")).toBe("existing file");
    });

    it("passes shape errored file to manage file", () => {
        const store = createSut({shapeErroredFile: "errored file"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[1].props("existingFileName")).toBe("errored file");
    });

    it("passes population response existing file name to manage file", () => {
        const store = createSut({population: {filename: "existing file"} as any});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[2].props("existingFileName")).toBe("existing file");
    });

    it("passes population errored file to manage file", () => {
        const store = createSut({populationErroredFile: "errored file"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[2].props("existingFileName")).toBe("errored file");
    });

    it("upload pjnz dispatches baseline/uploadPJNZ", (done) => {
        expectUploadToDispatchAction(0, () => actions.uploadPJNZ, done);
    });

    it("upload shape dispatches baseline/uploadShape", (done) => {
        expectUploadToDispatchAction(1, () => actions.uploadShape, done);
    });

    it("upload population dispatches baseline/uploadPopulation", (done) => {
        expectUploadToDispatchAction(2, () => actions.uploadPopulation, done);
    });

    it("remove pjnz dispatches baseline/deletePJNZ", (done) => {
        expectDeleteToDispatchAction(0, () => actions.deletePJNZ, done);
    });

    it("remove shape dispatches baseline/deleteShape", (done) => {
        expectDeleteToDispatchAction(1, () => actions.deleteShape, done);
    });

    it("remove population dispatches baseline/deletePopulation", (done) => {
        expectDeleteToDispatchAction(2, () => actions.deletePopulation, done);
    });

    it("can return true when fromADR", async () => {
        const store = createSut({
            pjnz: {
                "fromADR": true,
                "filters": {
                    "year": ""
                }
            } as any,
            population: {
                "fromADR": true,
                "filters": {
                    "year": ""
                }
            } as any,
            shape: {
                "fromADR": true,
                "filters": {
                    "year": ""
                }
            } as any
        });
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });

        expect(wrapper.findAllComponents(ManageFile)[0].props().fromADR).toBe(true);
        expect(wrapper.findAllComponents(ManageFile)[1].props().fromADR).toBe(true);
        expect(wrapper.findAllComponents(ManageFile)[2].props().fromADR).toBe(true);

    });

    it("can return false when not fromADR", async () => {
        const store = createSut({
            pjnz: {
                "fromADR": "",
                "filters": {
                    "year": ""
                }
            } as any,
            population: {
                "fromADR": "",
                "filters": {
                    "year": ""
                }
            } as any,
            shape: {
                "fromADR": "",
                "filters": {
                    "year": ""
                }
            } as any
        });
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });

        expect(wrapper.findAllComponents(ManageFile)[0].props().fromADR).toBe(false);
        expect(wrapper.findAllComponents(ManageFile)[1].props().fromADR).toBe(false);
        expect(wrapper.findAllComponents(ManageFile)[2].props().fromADR).toBe(false);

    });

    it("passes survey response existing file name to manage file", () => {
        const store = createSut({}, {}, {survey: {filename: "existing file"} as any});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[3].props("existingFileName")).toBe("existing file");
    });

    it("passes survey errored file to manage file", () => {
        const store = createSut({}, {}, {surveyErroredFile: "errored file"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[3].props("existingFileName")).toBe("errored file");
    });

    it("passes program response existing file name to manage file", () => {
        const store = createSut({}, {}, {program: {filename: "existing file"} as any});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[4].props("existingFileName")).toBe("existing file");
    });

    it("passes program errored file to manage file", () => {
        const store = createSut({}, {}, {programErroredFile: "errored file"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[4].props("existingFileName")).toBe("errored file");
    });

    it("passes anc response existing file name to manage file", () => {
        const store = createSut({}, {}, {anc: {filename: "existing file"} as any});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[5].props("existingFileName")).toBe("existing file");
    });

    it("passes anc errored file to manage file", () => {
        const store = createSut({}, {}, {ancErroredFile: "errored file"});
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });
        expect(wrapper.findAllComponents(ManageFile)[5].props("existingFileName")).toBe("errored file");
    });

    it("can return true when fromADR", async () => {
        const store = createSut({}, {}, {
            survey: {
                "fromADR": true
            } as any,
            anc: {
                "fromADR": true
            } as any,
            program: {
                "fromADR": true
            } as any
        });
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        })

        expect(wrapper.findAllComponents(ManageFile)[3].props().fromADR).toBe(true);
        expect(wrapper.findAllComponents(ManageFile)[4].props().fromADR).toBe(true);
        expect(wrapper.findAllComponents(ManageFile)[5].props().fromADR).toBe(true);
    });

    it("can return false when not fromADR", async () => {
        const store = createSut({}, {}, {
            survey: {
                "fromADR": ""
            } as any,
            anc: {
                "fromADR": ""
            } as any,
            program: {
                "fromADR": ""
            } as any
        });
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });

        expect(wrapper.findAllComponents(ManageFile)[3].props().fromADR).toBe(false);
        expect(wrapper.findAllComponents(ManageFile)[4].props().fromADR).toBe(false);
        expect(wrapper.findAllComponents(ManageFile)[5].props().fromADR).toBe(false);

    });

    const expectUploadToDispatchAction = (index: number,
                                          action: () => jest.MockInstance<any, any>,
                                          done: jest.DoneCallback) => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });

        wrapper.findAllComponents(ManageFile)[index].props().upload({name: "TEST"});
        setTimeout(() => {
            expect(action().mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    };

    const expectDeleteToDispatchAction = (index: number,
                                          action: () => jest.MockInstance<any, any>,
                                          done: jest.DoneCallback) => {
        const store = createSut();
        const wrapper = shallowMountWithTranslate(UploadInputs, store, {
            global: {
                plugins: [store]
            },
        });

        wrapper.findAllComponents(ManageFile)[index].props().deleteFile();
        setTimeout(() => {
            expect(action().mock.calls.length).toBe(1);
            done();
        });
    }
});

const expectFileIsRequired = (store: Store<any>, index: number) => {
    const wrapper = shallowMountWithTranslate(UploadInputs, store, {
        global: {
            plugins: [store]
        }
    });
    expect(wrapper.findAllComponents(ManageFile)[index].props().required).toBe(true);
}

const expectFileIsNotRequired = (store: Store<any>, index: number) => {
    const wrapper = shallowMountWithTranslate(UploadInputs, store, {
        global: {
            plugins: [store]
        }
    });
    expect(wrapper.findAllComponents(ManageFile)[index].props().required).toBe(false);
}
