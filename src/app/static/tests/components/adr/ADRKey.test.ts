import {defineComponent} from "vue";
import {mount, shallowMount} from "@vue/test-utils";

import ADRKey from "../../../app/components/adr/ADRKey.vue";
import Vuex, {ActionTree} from "vuex";
import {Error} from "../../../app/generated";
import {mockADRState, mockError, mockRootState} from "../../mocks";
import {mutations} from "../../../app/store/adr/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {RootState} from "../../../app/root";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import {ADRActions} from "../../../app/store/adr/actions";
import {ADRState} from "../../../app/store/adr/adr";

describe("ADR Key", function () {

    const saveStub = jest.fn();
    const deleteStub = jest.fn();

    const createStore = (key: string = "", error: Error | null = null) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                adr: {
                    namespaced: true,
                    state: mockADRState({key: key, keyError: error, schemas: {baseUrl: "www.adr.com"} as any}),
                    mutations,
                    actions: {
                        saveKey: saveStub,
                        deleteKey: deleteStub
                    } as Partial<ADRActions> & ActionTree<ADRState, RootState>
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("shows title", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.find("label").text()).toBe("ADR access key");
    });

    it("shows asterisks if key exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.find("span").text()).toBe("*******");
    });

    it("shows none message if key does not exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.find("span").text()).toBe("none provided");
    });

    it("shows remove button if key exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        const links = rendered.findAll(".btn")
        expect(links.length).toBe(1);
        expect(links.at(0).text()).toBe("Remove");
    });

    it("shows add button if key does not exist", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        const links = rendered.findAll(".btn");
        expect(links.length).toBe(2);
        expect(links.at(0).text()).toBe("Add");
    });

    it("shows button to ADR with tooltip if key does not exist", () => {
        const mockTooltipDirective = jest.fn();
        const rendered = shallowMount(ADRKey, {store: createStore(), directives: {"tooltip": mockTooltipDirective}});
        const links = rendered.findAll("a");
        expect(links.length).toBe(1);
        expect(links.at(0).text()).toBe("Get access key from ADR");
        expect(links.at(0).attributes("href")).toBe("www.adr.com/me");
        expect(mockTooltipDirective.mock.calls[0][0].innerHTML)
            .toBe("Get access key from ADR");
        expect(mockTooltipDirective.mock.calls[0][1].value)
            .toBe("To import data from the ADR you have to provide your ADR access key. " +
                "This can be found on your ADR profile page");
    });

    it("can add key", async () => {
        const rendered = mount(ADRKey,
            {
                store: createStore(),
                attachToDocument: true,
                stubs: ["tree-select"]
            });
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        links.at(0).trigger("click");

        await Vue.nextTick();
        expect(rendered.find("button").text()).toBe("Save");
        expect(rendered.find("input").element).toBe(document.activeElement);

        expect((rendered.find("input").element as HTMLInputElement).placeholder).toBe("Enter key");
        rendered.find("input").setValue("new-key-456");
        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("cannot save empty key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        links.at(0).trigger("click");

        await Vue.nextTick();

        rendered.find("input").setValue("");

        await Vue.nextTick();

        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.find("button").attributes("disabled")).toBe("disabled");
        expect(saveStub.mock.calls.length).toBe(0);
    });

    it("can cancel editing", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        links.at(0).trigger("click");

        await Vue.nextTick();

        expect(rendered.findAll(".input-group").length).toBe(1);

        const buttons = rendered.findAll(".btn")
        expect(buttons.at(1).text()).toBe("Cancel");
        buttons.at(1).trigger("click");

        await Vue.nextTick();

        expect(rendered.findAll(".input-group").length).toBe(0);
    });

    it("can remove key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        links.at(0).trigger("click");

        await Vue.nextTick();

        expect(deleteStub.mock.calls.length).toBe(1);
    });

    it("can add key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAll(".input-group").length).toBe(0);
        rendered.find(".btn").trigger("click");

        await Vue.nextTick();

        rendered.find("input").setValue("new-key-456");
        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("displays error if it exists", () => {
        let rendered = shallowMount(ADRKey, {store: createStore("", null)});
        expect(rendered.findAll(ErrorAlert).length).toBe(0);

        const fakeError = mockError("whatevs")
        rendered = shallowMount(ADRKey, {store: createStore("", fakeError)});
        expect(rendered.findAll(ErrorAlert).length).toBe(1);
        expect(rendered.find(ErrorAlert).props("error")).toEqual(fakeError);
    });

});
