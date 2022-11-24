package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

class ModelRunTests : SecureIntegrationTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can get model run status`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/status/1234")
        assertSuccess(responseEntity, "ModelStatusResponse")
    }


    @Test
    fun `can get model run result`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/result/nonsense")
        assertError(responseEntity,
                HttpStatus.BAD_REQUEST,
                "FAILED_TO_RETRIEVE_RESULT", "Failed to fetch result")
    }


    @Test
    fun `can get model run options`()
    {
        uploadMinimalFiles()
        val responseEntity = testRestTemplate.getForEntity<String>("/model/options/")
        assertSuccess(responseEntity, "ModelRunOptions")
    }

    @Test
    fun `can get model calibration options`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/calibrate/options/MWI")
        assertSuccess(responseEntity, "ModelRunOptions")
    }

    @Test
    fun `can run model`()
    {
        val entity = getModelRunEntity(getMockModelOptions())
        val responseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
        assertSuccess(responseEntity, "ModelSubmitResponse")
    }


    @Test
    fun `can validate model options`()
    {
        val entity = getValidationOptions()
        val responseEntity = testRestTemplate.postForEntity<String>("/model/validate/options/", entity)
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
        assertSuccess(responseEntity, "ModelOptionsValidate")
    }

    @Test
    fun `can submit calibrate`()
    {
        val entity = getModelRunEntity(getMockCalibrateModelOptions())
        val responseEntity = testRestTemplate.postForEntity<String>("/model/calibrate/submit/1234", entity)
        assertError(responseEntity,
                HttpStatus.BAD_REQUEST,
                "FAILED_TO_RETRIEVE_RESULT", "Failed to fetch result")
    }

    @Test
    fun `can get calibrate status`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/calibrate/status/1234")
        assertSuccess(responseEntity, "ModelStatusResponse")
    }

    @Test
    fun `can get calibrate result`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/calibrate/result/1234")
        assertError(responseEntity,
                HttpStatus.BAD_REQUEST,
                "FAILED_TO_RETRIEVE_RESULT", "Failed to fetch result")
    }

    @Test
    fun `can cancel run model`()
    {

        val entity = getModelRunEntity(getMockModelOptions())
        val runResponseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
        val bodyJSON = ObjectMapper().readTree(runResponseEntity.body)
        val modelRunId = bodyJSON["data"]["id"].asText()


        val responseEntity = testRestTemplate.postForEntity<String>("/model/cancel/$modelRunId")
        assertSuccess(responseEntity, "ModelCancelResponse")
    }

    @Test
    fun `can get comparison plot`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/comparison/plot/1234")
        assertError(responseEntity,
                HttpStatus.BAD_REQUEST,
                "FAILED_TO_RETRIEVE_RESULT", "Failed to fetch result")
    }

}
