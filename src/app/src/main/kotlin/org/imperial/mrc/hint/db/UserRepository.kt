package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.exceptions.UserException
import org.pac4j.core.profile.CommonProfile
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration

interface UserRepository
{
    fun addUser(email: String, password: String)
    fun removeUser(email: String)
    fun getUser(email: String): CommonProfile?
    fun updateUserPassword(user: CommonProfile, password: String)
}

@Configuration
class DbProfileServiceUserRepository(@Autowired val profileService: DbProfileService): UserRepository
{
    override fun addUser(email: String, password: String)
    {
        if (getUser(email) != null)
        {
            throw UserException("User already exists")
        }

        val profile = DbProfile()
        profile.build(email, mapOf("username" to email))

        profileService.create(profile, password)
    }

    override fun removeUser(email: String)
    {
        getUser(email)?: throw UserException("User does not exist")
        profileService.removeById(email)
    }

    override fun getUser(email: String): CommonProfile?
    {
        return profileService.findById(email)
    }

    override fun updateUserPassword(user: CommonProfile, password: String)
    {
        val dbUser: DbProfile = getUser(user.id) as DbProfile
        profileService.update(dbUser, password)
    }
}

