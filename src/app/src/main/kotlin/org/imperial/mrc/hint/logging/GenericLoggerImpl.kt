package org.imperial.mrc.hint.logging

import net.logstash.logback.argument.StructuredArguments.kv
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.ErrorDetail
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@Component
class GenericLoggerImpl(
        private val logger: Logger = LoggerFactory.getLogger(GenericLoggerImpl::class.java)
) : GenericLogger
{
    override fun info(action: String)
    {
        val log = LogMetadata(action = action)
        logger.info("{}", kv("hint", log))
    }

    override fun info(action: String, request: HttpServletRequest, user: String?)
    {
        val log = LogMetadata(
            action = action,
            request = Request(request),
            username = user
        )
        logger.error("{}", kv("hint", log))
    }

    override fun error(request: HttpServletRequest, response: HttpServletResponse, message: String?)
    {
        val log = LogMetadata(
            error = ErrorMessage(
                details = ErrorDetail(
                    HttpStatus.valueOf(response.status),
                    message.toString(),
                    ErrorDetail.defaultError
                )
            ),
            request = Request(request),
            username = request.session.id
        )
        logger.error("{}", kv("hint", log))
    }

    override fun error(request: HttpServletRequest, error: Throwable?, status: HttpStatus)
    {
        val log = LogMetadata(
            error = ErrorMessage(
                error,
                ErrorDetail(
                    status,
                    error?.message.toString(),
                    ErrorDetail.defaultError,
                    listOf(error?.message.toString())
                )
            ),
            request = Request(request),
            username = request.session.id
        )

        logger.error("{}", kv("hint", log))
    }

    override fun error(request: HttpServletRequest, error: HintException)
    {
        val log = LogMetadata(
            error = ErrorMessage(
                error.cause,
                ErrorDetail(
                    error.httpStatus,
                    error.message.toString(),
                    ErrorDetail.defaultError,
                    listOf(error.message.toString())
                ),
                error.key
            ),
            request = Request(request),
            username = request.session.id
        )

        logger.error("{}", kv("hint", log))
    }
}
