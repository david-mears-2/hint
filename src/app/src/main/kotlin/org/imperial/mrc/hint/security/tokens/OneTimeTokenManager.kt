package org.imperial.mrc.hint.security.tokens

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.TokenRepository
import org.pac4j.core.profile.CommonProfile
import org.pac4j.jwt.profile.JwtGenerator
import org.springframework.stereotype.Component
import org.pac4j.jwt.config.signature.SignatureConfiguration
import org.pac4j.jwt.credentials.authenticator.JwtAuthenticator
import java.time.Duration
import java.security.SecureRandom
import java.time.Instant
import java.util.*

@Component
class OneTimeTokenManager(
        appProperties: AppProperties,
        private val tokenRepository: TokenRepository,
        signatureConfiguration: SignatureConfiguration,
        private val authenticator: JwtAuthenticator
)
{
    private val generator = JwtGenerator<CommonProfile>(signatureConfiguration)
    private val issuer = appProperties.tokenIssuer
    private val random = SecureRandom()

    fun generateOnetimeSetPasswordToken(username: String): String
    {
        val token= generator.generate(mapOf(
                "iss" to issuer,
                "sub" to username,
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "nonce" to getNonce()
        ))

        tokenRepository.storeOneTimeToken(token)

        return token
    }

    fun validateToken(token: String): CommonProfile?
    {
        return authenticator.validateToken(token)
    }

    fun validateTokenAndGetClaims(token: String): Map<String, Any>
    {

        return authenticator.validateTokenAndGetClaims(token)
    }

    private fun getNonce(): String
    {
        val bytes = ByteArray(32)
        random.nextBytes(bytes)
        return Base64.getEncoder().encodeToString(bytes)
    }
}