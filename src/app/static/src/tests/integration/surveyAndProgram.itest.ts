import {actions} from "../../app/store/surveyAndProgram/actions";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and program actions", () => {

    beforeEach(() => {
        fs.writeFileSync("fakesurvey");
    });

    afterEach(() => {
        fs.unlinkSync("fakesurvey")
    });

    it("can upload survey", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("fakesurvey");
        const formData = new FormData();
        formData.append('file', file);

        await actions._uploadSurvey({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyError",
            payload: "could not find function \"validate_func\""
        });
    });

});
