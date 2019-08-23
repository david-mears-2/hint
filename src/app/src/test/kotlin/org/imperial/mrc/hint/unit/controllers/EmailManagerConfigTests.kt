package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.emails.EmailManagerConfig
import org.imperial.mrc.hint.emails.WriteToDiskEmailManager
import org.junit.jupiter.api.Test

class EmailManagerConfigTests
{
    val sut = EmailManagerConfig()

    @Test
    fun `returns WriteToDisk manager when email mode is disk`()
    {
        val mockAppProperties = mock<AppProperties>{
            on { emailMode } doReturn "disk"
        }

        val result = sut.getEmailManager(mockAppProperties)
        assertThat(result).isInstanceOf(WriteToDiskEmailManager::class.java)
    }

    @Test
    fun `throws exception when email mode is unknown`() {
        val mockAppProperties = mock<AppProperties> {
            on { emailMode } doReturn "unsupported"
        }

        assertThatThrownBy { sut.getEmailManager(mockAppProperties) }.hasMessage("Unknown email mode 'unsupported'")
    }
}