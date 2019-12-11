package org.imperial.mrc.hint.exceptions

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.ErrorDetail
import org.postgresql.util.PSQLException
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.lang.Nullable
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler
import java.text.MessageFormat
import java.util.*
import javax.validation.ConstraintViolationException

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler(private val errorCodeGenerator: ErrorCodeGenerator,
                           private val appProperties: AppProperties)
    : ResponseEntityExceptionHandler() {

    override fun handleExceptionInternal(e: java.lang.Exception,
                                         @Nullable body: Any?,
                                         headers: HttpHeaders,
                                         status: HttpStatus,
                                         request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return translatedError(e.message ?: "unexpectedError", status, request)
    }

    @ExceptionHandler(HintException::class)
    protected fun handleHintException(e: HintException, request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return translatedError(e.message!!, e.httpStatus, request)
    }

    @ExceptionHandler(ConstraintViolationException::class)
    protected fun handleConstraintViolationException(e: ConstraintViolationException, request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return translatedError(e.message!!, HttpStatus.BAD_REQUEST, request)
    }

    @ExceptionHandler(PSQLException::class)
    protected fun handlePSQLException(e: PSQLException, request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return translatedError("unexpectedError", HttpStatus.INTERNAL_SERVER_ERROR, request)
    }

    private fun translatedError(key: String, status: HttpStatus, request: WebRequest): ResponseEntity<Any> {
        val language = request.getHeader("Accept-Language") ?: "en"
        val resources = ResourceBundle.getBundle("MessageBundle", Locale(language))

        var message = if (resources.containsKey(key)) {
            resources.getString(key)
        } else {
            key
        }
        if (key == "unexpectedError") {
            val formatter = MessageFormat("")
            formatter.applyPattern(message)
            val messageArguments = arrayOf(
                    appProperties.applicationTitle,
                    errorCodeGenerator.newCode(),
                    appProperties.supportEmail
            )
            message = formatter.format(messageArguments)
        }
        return ErrorDetail(status, message).toResponseEntity()
    }

}
