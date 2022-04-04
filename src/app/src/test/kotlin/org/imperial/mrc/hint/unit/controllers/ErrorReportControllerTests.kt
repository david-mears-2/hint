package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.controllers.ErrorReportController
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.springframework.http.*

class ErrorReportControllerTests
{

    private val data = ErrorReport(
            "test.user@example.com",
            "Kenya",
            "Kenya2022",
            "Model",
            "123",
            "1234",
            mapOf("spectrum" to "spectrum123", "summary" to "summary123", "coarse_output" to "coarse123" ),
            listOf(
                    Errors("#65ae0d095ea", "test error msg", "fomot-hasah-livad"),
                    Errors("#25ae0d095e1", "test error msg2", "fomot-hasah-livid")
            ),
            "",
            "test steps",
            "test agent",
            mapOf(
                    "naomi" to "v1",
                    "hintr" to "v2",
                    "rrq" to "v3",
                    "traduire" to "v4",
                    "hint" to "v5"
            ),
            "2021-10-12T14:07:22.759Z"
    )

    @Test
    fun `can post error report to teams`()
    {
        val result = testFlowClient(ResponseEntity.ok("whatever"))

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(result.body).isEqualTo("whatever")
    }

    @Test
    fun `can return error response when request is unsuccessful`()
    {
        val result = testFlowClient(ResponseEntity.badRequest().build())

        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    private fun testFlowClient(response: ResponseEntity<String>): ResponseEntity<String>
    {
        val mockFlowClient = mock<FuelFlowClient>
        {
            on { notifyTeams(data) } doReturn response
        }

        val sut = ErrorReportController(mockFlowClient)

        return sut.postErrorReport(data)
    }

}
