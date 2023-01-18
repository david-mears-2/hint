import {shallowMount} from "@vue/test-utils";
import DownloadButton from "../../../../app/components/plots/download/downloadButton.vue"
import {DownloadIcon} from "vue-feather-icons";

describe("download button", () => {

    const downloadProps = {
        name: "downloadPlotData",
        disabled: false
    }
    const mockTranslate = jest.fn()
    const getWrapper = (props = downloadProps) => {
        return shallowMount(DownloadButton, {
            directives: {
                translate: mockTranslate
            },
            propsData: props
        })
    }

    it('it can render button as expected ', () => {
        const wrapper = getWrapper()
        expect(wrapper.props()).toEqual({
            disabled: false,
            name: "downloadPlotData"
        })
        expect(wrapper.find(".btn").attributes("disabled")).toBeUndefined()
        expect(mockTranslate.mock.calls.length).toBe(1)
        expect(mockTranslate.mock.calls[0][1].value).toBe("downloadPlotData")
    });

    it('it does not render button when disabled prop is true ', () => {
        const wrapper = getWrapper({disabled: true, name: "downloadPlotData"})
        expect(wrapper.find(".btn").attributes("disabled")).toBe("disabled")
    });

    it('it can emit click event ', async() => {
        const wrapper = getWrapper()
        await wrapper.find(".btn").trigger("click")
        expect(wrapper.emitted("click").length).toBe(1)
    });

    it('it can render download icon', () => {
        const wrapper = getWrapper()
        expect(wrapper.find(DownloadIcon).exists()).toBe(true)
        expect(wrapper.find(DownloadIcon).attributes("size")).toBe("20")
        expect(wrapper.find(DownloadIcon).classes()).toEqual(["icon", "ml-2"])
    });
})