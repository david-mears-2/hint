package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic.Companion.GUEST_USER
import org.pac4j.core.client.Clients
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.J2ESessionStore
import org.pac4j.core.profile.CommonProfile
import org.pac4j.core.profile.ProfileManager
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import org.springframework.stereotype.Component
import java.util.*
import javax.sql.DataSource

@Configuration
@ComponentScan(basePackages = ["org.pac4j.springframework.web", "org.pac4j.springframework.component"])
class Pac4jConfig
{

    @Bean
    fun getProfileService(dataSource: DataSource): HintDbProfileService
    {
        return HintDbProfileService(TransactionAwareDataSourceProxy(dataSource), SecurePasswordEncoder())
    }

    @Bean
    fun getPac4jConfig(profileService: DbProfileService): Config
    {
        val formClient = FormClient("/login", profileService)
        val clients = Clients("/callback", formClient)
        return Config(clients).apply {
            sessionStore = J2ESessionStore()
        }
    }
}

@Component
class Session(private val webContext: WebContext, private val pac4jConfig: Config)
{

    companion object
    {
        private const val VERSION_ID = "version_id"
        private const val APP_MODE = "app_mode"
    }

    fun getUserProfile(): CommonProfile
    {
        val manager = ProfileManager<CommonProfile>(webContext)
        val profiles = manager.getAll(true)
        return profiles.singleOrNull() ?: CommonProfile().apply {
            id = GUEST_USER
        }
    }

    fun userIsGuest(): Boolean
    {
        return getUserProfile().id == GUEST_USER
    }

    fun getVersionId(): String
    {
        //Generate a new id if none exists
        var versionId = pac4jConfig.sessionStore.get(webContext, VERSION_ID) as String?
        if (versionId == null)
        {
            versionId = generateVersionId()
            setVersionId(versionId)
        }
        return versionId
    }

    fun setVersionId(value: String?)
    {
        pac4jConfig.sessionStore.set(webContext, VERSION_ID, value)
    }

    fun getMode(): String?
    {
        return pac4jConfig.sessionStore.get(webContext, APP_MODE) as String?
    }

    fun setMode(value: String?)
    {
        pac4jConfig.sessionStore.set(webContext, APP_MODE, value)
    }

    fun generateVersionId(): String
    {
        return UUID.randomUUID().toString()
    }
}

