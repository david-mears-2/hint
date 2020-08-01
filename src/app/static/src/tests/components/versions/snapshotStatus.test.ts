import Vuex from 'vuex';
import {shallowMount} from '@vue/test-utils';
import SnapshotStatus from "../../../app/components/versions/SnapshotStatus.vue";
import {VersionsState} from "../../../app/store/versions/versions";
import {mockVersionsState} from "../../mocks";
import {CheckIcon, AlertTriangleIcon} from "vue-feather-icons";

describe("Stepper component", () => {
    const getWrapper = (versionsState: Partial<VersionsState> = {}) => {
        const store =  new Vuex.Store({
            modules: {
                versions: {
                    namespaced: true,
                    state: mockVersionsState(versionsState),
                }
            }
        });
        return shallowMount(SnapshotStatus, {store});
    };
    const date = new Date(2020, 8, 1, 12, 45, 59);

    it("does not render if no snapshot time", () => {
        const wrapper = getWrapper();
        expect(wrapper.isEmpty()).toBe(true);
    });

    it("renders as expected when snapshotSuccess is true", () => {
        const wrapper = getWrapper({snapshotSuccess: true, snapshotTime: date});

        expect(wrapper.text()).toBe("Saved snapshot at 12:45");
        expect(wrapper.find(CheckIcon).exists()).toBe(true);
        expect(wrapper.find(AlertTriangleIcon).exists()).toBe(false);
    });

    it("renders as expected when snapshotSuccess is false", () => {
        const wrapper = getWrapper({snapshotSuccess: false, snapshotTime: date});

        expect(wrapper.text()).toBe("Could not save snapshot at 12:45");
        expect(wrapper.find(CheckIcon).exists()).toBe(false);
        expect(wrapper.find(AlertTriangleIcon).exists()).toBe(true);
    });
});
