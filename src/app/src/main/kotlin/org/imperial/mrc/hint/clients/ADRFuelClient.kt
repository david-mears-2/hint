package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.*
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.logADRRequestDuration
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import java.io.File
import java.io.InputStream
import java.net.http.HttpResponse

/**
 * This class should be depreciated and removed in January 2025
 * as we will be sure of supporting only SSO
 *
 */
@Component
class ADRClientBuilder(val appProperties: AppProperties,
                       val encryption: Encryption,
                       val session: Session,
                       val userRepository: UserRepository,
                       val logger: GenericLogger)
{

    fun build(): ADRClient
    {
        val userId = this.session.getUserProfile().id
        val encryptedKey = this.userRepository.getADRKey(userId) ?: throw UserException("noADRKey")
        val apiKey = this.encryption.decrypt(encryptedKey)
        return ADRFuelClient(this.appProperties, apiKey, this.logger)
    }

    fun buildSSO(): ADRClient
    {
        return ADRFuelClient(this.appProperties, "", this.logger)
    }
}

interface ADRClient
{
    fun getInputStream(url: String): HttpResponse<InputStream>
    fun get(url: String): ResponseEntity<String>
    fun post(url: String, params: List<Pair<String, String>>): ResponseEntity<String>
    fun postFile(url: String, parameters: List<Pair<String, Any?>>, file: Pair<String, File>): ResponseEntity<String>
}

class ADRFuelClient(appProperties: AppProperties,
                    private val apiKey: String,
                    private val logger: GenericLogger)
    : FuelClient(appProperties.adrUrl + "api/3/action"), ADRClient
{
    //private val header = Pair("Authorization", apiKey)
    private val header = if (apiKey.isNotEmpty())
    {
        Pair("Authorization", apiKey)
    } else
    {
        Pair("", "")
    }

    override fun get(url: String): ResponseEntity<String>
    {
        return logADRRequestDuration({ super.get(url) }, logger)
    }

    override fun postFile(
        url: String,
        parameters: List<Pair<String, Any?>>,
        file: Pair<String, File>,
    ): ResponseEntity<String>
    {
        return logADRRequestDuration({ super.postFile(url, parameters, file) }, logger)
    }

    override fun postJson(urlPath: String?, json: String): ResponseEntity<String>
    {
        return logADRRequestDuration({ super.postJson(urlPath, json) }, logger)
    }

    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf(header.first to header.second)
    }

    override fun httpRequestHeaders(): Array<String>
    {
        return arrayOf(header.first, header.second)
    }

    override fun getInputStream(url: String): HttpResponse<InputStream>
    {
        return logADRRequestDuration({ getStream(getUri(url)) }, logger)
    }
}
