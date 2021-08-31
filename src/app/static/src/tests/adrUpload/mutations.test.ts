import {mockError, mockADRUploadState} from "../mocks";
import {mutations, ADRUploadMutation} from "../../app/store/adrUpload/mutations";

describe("ADR mutations", () => {

    it("can set upload files", () => {
        const state = mockADRUploadState();
        const payload = {
            outputZip: {
                index: 1,
                displayName: "test",
                resourceType: "testType",
                resourceFilename: "testFile",
                resourceId: "123",
                lastModified: "2021-03-02",
                url: "https://test"
            }
        };
        mutations[ADRUploadMutation.SetUploadFiles](state, {payload});
        expect(state.uploadFiles).toBe(payload);
    });

    it("can set upload error", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.SetADRUploadError](state, {payload: mockError("error detail")});
        expect(state.uploadError!!.detail).toBe("error detail");
        expect(state.uploading).toBe(false);

        mutations[ADRUploadMutation.SetADRUploadError](state, {payload: null});
        expect(state.uploadError).toBe(null);
        expect(state.uploading).toBe(false);
        expect(state.currentFileUploading).toBe(null);
        expect(state.totalFilesUploading).toBe(null);
    });

    it("can set upload started", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.ADRUploadStarted](state, {payload: 2});
        expect(state.uploadError).toBe(null);
        expect(state.uploading).toBe(true);
        expect(state.uploadComplete).toBe(false);
        expect(state.totalFilesUploading).toBe(2);
        expect(state.releaseCreated).toBe(false);
        expect(state.releaseFailed).toBe(false);
    });

    it("can set upload progress", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.ADRUploadProgress](state, {payload: 1});
        expect(state.currentFileUploading).toBe(1);
    });

    it("can set upload completed", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.ADRUploadCompleted](state);
        expect(state.uploading).toBe(false);
        expect(state.uploadComplete).toBe(true);
        expect(state.currentFileUploading).toBe(null);
        expect(state.totalFilesUploading).toBe(null);
    });

    it("can clear status", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.ClearStatus](state);
        expect(state.uploadComplete).toBe(false);
        expect(state.releaseCreated).toBe(false);
        expect(state.releaseFailed).toBe(false);
    });

    it("can set release created", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.ReleaseCreated](state);
        expect(state.releaseCreated).toBe(true);
    });

    it("can set release failed with error", () => {
        const state = mockADRUploadState();
        mutations[ADRUploadMutation.ReleaseFailed](state, {payload: mockError("Version already exists for this activity")});
        expect(state.releaseFailed).toBe(true);
        expect(state.uploadError!!.detail).toBe("A release already exists on ADR for the latest files");

        mutations[ADRUploadMutation.ReleaseFailed](state, {payload: mockError("Version names must be unique per dataset")});
        expect(state.releaseFailed).toBe(true);
        expect(state.uploadError!!.detail).toBe("Release names must be unique per dataset and a release with the same name already exists on ADR. Try renaming the project to generate a new release name.");

        mutations[ADRUploadMutation.ReleaseFailed](state, {payload: mockError("other error")});
        expect(state.releaseFailed).toBe(true);
        expect(state.uploadError!!.detail).toBe("other error");
    });
});
