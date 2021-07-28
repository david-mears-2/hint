import {shallowMount} from "@vue/test-utils";
import Download from "../../../app/components/downloadResults/Download.vue"

describe(`download`, () => {

    const downloadSummary = {
        downloading: true,
        complete: false,
        downloadId: null,
        error: null
    }

    const downloadTranslate = {
        header: "downloadSummaryReport",
        button: "download"
    }

    const mockDirective = jest.fn()

    const getWrapper = () => {
        return shallowMount(Download,
            {
                propsData: {
                    file: downloadSummary,
                    modalOpen: false,
                    translateKey: downloadTranslate
                },
                directives: {"translate": mockDirective}
            })
    }

    it(`renders components as expected`, () => {
        const wrapper = getWrapper()
        expect(mockDirective.mock.calls[0][1].value).toBe("downloadSummaryReport")
        expect(mockDirective.mock.calls[1][1].value).toBe("download")
        expect(wrapper.find("download-icon-stub").exists()).toBe(true)
        expect(wrapper.find("download-progress-stub").props()).toEqual({
            "downloading": true,
            "translateKey": "downloading"
        })
    })

    it(`can emit download`, async () => {
        const wrapper = getWrapper()
        const downloadSummary = {
            downloading: false,
            complete: false,
            downloadId: null,
            error: null
        }
        const button = wrapper.find("button")
        expect(button.classes()).toEqual( ["btn", "btn-lg", "my-3", "btn-secondary"])
        expect(button.attributes("disabled")).toEqual( "disabled")

        await wrapper.setProps({file: downloadSummary})
        expect(button.classes()).toEqual( ["btn", "btn-lg", "my-3", "btn-red"])
        expect(button.attributes("disabled")).toBeUndefined()

        button.trigger("click")
        expect(wrapper.emitted().click.length).toBe(1)
    })
})