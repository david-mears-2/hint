package org.imperial.mrc.hint.integration

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.exceptions.*
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.Language
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.imperial.mrc.hint.helpers.unexpectedErrorRegex
import org.imperial.mrc.hint.logging.GenericLogger
import org.junit.jupiter.api.Test
import org.postgresql.util.PSQLException
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.core.io.FileSystemResource
import org.springframework.http.*
import org.springframework.http.converter.HttpMessageNotWritableException
import org.springframework.util.LinkedMultiValueMap
import java.io.File
import java.lang.reflect.UndeclaredThrowableException
import java.util.*
import javax.servlet.http.HttpServletRequest

class ExceptionHandlerTests : SecureIntegrationTests()
{

    private val mockException = mock<HttpMessageNotWritableException>()

    private val mockLogger = mock<GenericLogger>()

    private val errorArgs = arrayOf("https://adr-resource-server.com")

    @Test
    fun `route not found errors are correctly formatted`()
    {
        val entity = testRestTemplate.getForEntity("/nonsense/route/", String::class.java)
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        JSONValidator().validateError(entity.body!!,
                "OTHER_ERROR",
            "$unexpectedErrorRegex No handler found for GET /nonsense/route/"
        )
    }

    @Test
    fun `not found page is correctly rendered when header accepts html`()
    {
        val headers: HttpHeaders = HttpHeaders()
        headers.accept = Collections.singletonList(MediaType.TEXT_HTML)
        val httpEntity = HttpEntity("body", headers)

        val entity = testRestTemplate.exchange("/nonsense/route/",
                HttpMethod.GET, httpEntity, String::class.java)

        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        Assertions.assertThat(entity.body).contains("404 Error Page")
    }

    @Test
    fun `adr resource error are correctly formatted in English`()
    {
        expectTranslatedAdrException(
            "adrResourceError",
            "Unable to load resource, check resource in ADR ${errorArgs.first()}.",
            Language.EN,
        )
    }
    @Test
    fun `adr resource error are correctly formatted without adrURl`()
    {
        expectTranslatedAdrException(
            "adrResourceError",
            "Unable to load resource, check resource in ADR .",
            Language.EN,
            ""
        )
    }

    @Test
    fun `adr resource error are correctly formatted in French`()
    {
        expectTranslatedAdrException(
            "adrResourceError",
            "Impossible de charger la ressource, vérifiez la ressource dans ADR ${errorArgs.first()}.",
            Language.FR
        )
    }

    @Test
    fun `adr resource error are correctly formatted in Portuguese`()
    {
        expectTranslatedAdrException(
            "adrResourceError",
            "Não é possível carregar o recurso, verifique o recurso no ADR ${errorArgs.first()}.",
            Language.PT
        )
    }

    @Test
    fun `adr no permission to load resource error are correctly formatted in English`()
    {
        expectTranslatedAdrException(
            "noPermissionToAccessResource",
            "You do not have permission to load this resource from ADR. Contact dataset admin for permission.",
            Language.EN,
        )
    }

    @Test
    fun `adr no permission to load resource error are correctly formatted in French`()
    {
        expectTranslatedAdrException(
            "noPermissionToAccessResource",
            "Vous n'êtes pas autorisé à charger cette ressource à partir d'ADR. Contacter " +
                    "l'administrateur de l'ensemble de données pour obtenir l'autorisation",
            Language.FR,
        )
    }

    @Test
    fun `adr no permission to load resource error are correctly formatted in Portuguese`()
    {
        expectTranslatedAdrException(
            "noPermissionToAccessResource",
            "Você não tem permissão para carregar este recurso do ADR. Entre em contato com o " +
                    "administrador do conjunto de dados para obter permissão.",
            Language.PT,
        )
    }

    @Test
    fun `bad requests are correctly formatted`()
    {
        val testFile = File("$tmpUploadDirectory/whatever.csv")
        testFile.parentFile.mkdirs()
        testFile.createNewFile()
        val body = LinkedMultiValueMap<String, Any>()
        body.add("wrongPartName", FileSystemResource(testFile))
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA
        val badPostEntity = HttpEntity(body, headers)

        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", badPostEntity)

        assertError(entity,
                HttpStatus.BAD_REQUEST,
                "OTHER_ERROR",
                "$unexpectedErrorRegex Required request part 'file' is not present")
    }

    @Test
    fun `unexpected errors are correctly formatted`()
    {
        val mockErrorCodeGenerator = mock<ErrorCodeGenerator> {
            on { newCode() } doReturn "1234"
        }
        val mockProperties = mock<AppProperties> {
            on { applicationTitle } doReturn "AppTitle"
            on { supportEmail } doReturn "support@email.com"
        }
        val sut = HintExceptionHandler(mockErrorCodeGenerator, mockProperties, mockLogger)
        val result = sut.handleException(mockException, mock())
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                "An unexpected error occurred. If you see this message while you are using " +
                        "AppTitle at a workshop, " +
                        "please contact your workshop technical support and show them this code: 1234. " +
                        "Otherwise please contact support at support@email.com and quote this code: 1234.")
    }

    @Test
    fun `unexpected error message is translated if language accept header is passed`()
    {
        val mockErrorCodeGenerator = mock<ErrorCodeGenerator> {
            on { newCode() } doReturn "1234"
        }
        val mockProperties = mock<AppProperties> {
            on { applicationTitle } doReturn "AppTitle"
            on { supportEmail } doReturn "support@email.com"
        }
        val mockRequest = mock<HttpServletRequest> {
            on { getHeader("Accept-Language") } doReturn "fr"
        }
        val sut = HintExceptionHandler(mockErrorCodeGenerator, mockProperties, mockLogger)
        val result = sut.handleException(mockException, mockRequest)
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                "Une erreur inattendue s'est produite. Si vous voyez ce message pendant " +
                        "que vous utilisez AppTitle dans un atelier, " +
                        "veuillez contacter le support technique de votre atelier et leur indiquer ce code : 1234. " +
                        "Sinon, veuillez contacter le support à support@email.com et citer ce code : 1234")
    }

    @Test
    fun `unexpected error message is in english if no translations are available`()
    {
        val mockErrorCodeGenerator = mock<ErrorCodeGenerator> {
            on { newCode() } doReturn "1234"
        }
        val mockProperties = mock<AppProperties> {
            on { applicationTitle } doReturn "AppTitle"
            on { supportEmail } doReturn "support@email.com"
        }
        val mockRequest = mock<HttpServletRequest> {
            on { getHeader("Accept-Language") } doReturn "de"
        }
        val sut = HintExceptionHandler(mockErrorCodeGenerator, mockProperties, mockLogger)
        val result = sut.handleException(mockException, mockRequest)
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                "An unexpected error occurred. If you see this message while you are " +
                        "using AppTitle at a workshop, " +
                        "please contact your workshop technical support and show them this code: 1234. " +
                        "Otherwise please contact support at support@email.com and quote this code: 1234.")

    }

    @Test
    fun `translated error message falls back to key if no value is present`()
    {
        val sut = HintExceptionHandler(mock(), mock(), mock())
        val result = sut.handleHintException(HintException("badKey"), mock())
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                "badKey")
    }

    @Test
    fun `does not include original message from handle exceptions`()
    {
        val sut = HintExceptionHandler(RandomErrorCodeGenerator(), ConfiguredAppProperties(), mockLogger)
        val result = sut.handleException(PSQLException("some message", null), mock())
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                unexpectedErrorRegex)
        assertThat(result.body!!.toString()).doesNotContain("trace")
    }

    @Test
    fun `handles HintExceptions thrown inside UndeclaredThrowableException`()
    {
        val sut = HintExceptionHandler(RandomErrorCodeGenerator(), ConfiguredAppProperties(), mockLogger)
        val fakeError = UndeclaredThrowableException(HintException("some message", HttpStatus.BAD_REQUEST))
        val result = sut.handleException(fakeError, mock())
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                "some message")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    private fun expectTranslatedAdrException(
        key: String,
        expectedMessage: String,
        lang: Language,
        args: String = "https://adr-resource-server.com",
    )
    {
        val mockProperties = mock<AppProperties>()

        val mockRequest = mock<HttpServletRequest> {
            on { getHeader("Accept-Language") } doReturn lang.toString()
        }

        val sut = HintExceptionHandler(mock(), mockProperties, mockLogger)

        val result = sut.handleAdrException(
            AdrException(
                key,
                HttpStatus.SERVICE_UNAVAILABLE,
                args
            ), mockRequest
        )

        JSONValidator().validateError(result.body!!.toString(), "OTHER_ERROR", expectedMessage)
    }
}
