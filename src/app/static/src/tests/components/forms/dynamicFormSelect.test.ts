import {mount} from "@vue/test-utils";
import {SelectControl} from "../../../app/components/forms/types";
import DynamicFormSelect from "../../../app/components/forms/DynamicFormSelect.vue";

describe('Dynamic form select component', function () {

    const fakeSelect: SelectControl = {
        name: "id_2",
        type: "select",
        required: true,
        options: [{id: "opt1", label: "option 1"}, {id: "opt2", label: "option2"}],
        default: "opt2"
    };

    it("renders options", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });
        const options = rendered.findAll("option");
        expect(options.length).toBe(3);
        expect((options.at(1).element as HTMLSelectElement).value).toBe("opt1");
        expect(options.at(1).text()).toBe("option 1");
    });

    it("default is selected if present", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).value).toBe("opt2");
    });

    it("is required if formControl.required is true", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: {...fakeSelect, required: true}
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).required).toBe(true);
    });

    it("is not required if formControl.required is false", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: {...fakeSelect, required: false}
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).required).toBe(false);
    });

});