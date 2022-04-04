package org.imperial.mrc.hint.unit.logging

import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import net.logstash.logback.argument.StructuredArguments.kv
import org.imperial.mrc.hint.logging.*
import org.junit.jupiter.api.Test

class LoggingTests
{
    private val testLogData = LogMetadata(
        "testUser",
        AppOrigin("hint", "backend"),
        Request(
            "POST",
            "/project",
            "hint",
            Client("Safari", "127.0.0.1", "session1")
        ),
        null,
        null,
        "Updating project note",
        emptyList()
    )

    private val mockLogger = mock<org.slf4j.Logger>()

    @Test
    fun `can display error logging in key value format`()
    {
        val sut = GenericLoggerImpl(mockLogger)
        sut.error(testLogData)

        verify(mockLogger).error("TEST ERROR",
            kv("Username", testLogData.username),
            kv("App", testLogData.app),
            kv("Request", testLogData.request),
            kv("Response", testLogData.response),
            kv("Error", testLogData.error),
            kv("Action", testLogData.action),
            kv("Tags", testLogData.tags)
        )
    }

    @Test
    fun `can display info logging in key value format`()
    {
        val sut = GenericLoggerImpl(mockLogger)
        sut.info(testLogData)

        verify(mockLogger).info("TEST INFO",
            kv("Username", testLogData.username),
            kv("App", testLogData.app),
            kv("Request", testLogData.request),
            kv("Response", testLogData.response),
            kv("Error", testLogData.error),
            kv("Action", testLogData.action),
            kv("Tags", testLogData.tags))
    }
}
