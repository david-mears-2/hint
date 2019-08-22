package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenChecker
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import java.time.Instant
import java.util.*

class OneTimeTokenManagerTests {

    @Test
    fun `can generate onetime set password token`()
    {
        val mockAppProperties = mock<AppProperties>(){
            on { tokenIssuer } doReturn "test issuer"
        }

        val mockUser = mock<CommonProfile> {
            on { username } doReturn "test user"
        }

        val mockTokenChecker =  mock<OneTimeTokenChecker> {
            on { checkToken(any()) } doReturn true
        }

        val sut = OneTimeTokenManager(mockAppProperties)

        val token = sut.generateOnetimeSetPasswordToken(mockUser)

        val claims = sut.verifyOneTimeToken(token, mockTokenChecker)
        assertThat(claims["iss"]).isEqualTo("test issuer")
        assertThat(claims["token_type"]).isEqualTo("ONETIME")
        assertThat(claims["sub"]).isEqualTo("test user")
        assertThat(claims["exp"] as Date).isAfter(Date.from(Instant.now()))
        assertThat(claims["url"]).isEqualTo("/password/set/")
        assertThat(claims["nonce"]).isNotNull()
    }
}