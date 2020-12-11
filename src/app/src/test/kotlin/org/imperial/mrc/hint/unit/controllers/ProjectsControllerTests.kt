package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.NullNode
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.controllers.ProjectsController
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.Project
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.models.VersionDetails
import org.imperial.mrc.hint.models.VersionFile
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.mockito.internal.verification.Times
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus

class ProjectsControllerTests
{
    private val mockProfile = mock<CommonProfile> {
        on { id } doReturn "testUser"
    }

    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn mockProfile
        on { generateVersionId() } doReturn "testVersion"
        on { userIsGuest() } doReturn false
        on { getVersionId() } doReturn "testVersion"
    }

    private val mockVersion = Version("testVersion", "createdTime", "updatedTime", 1)

    private val parser = ObjectMapper()

    @Test
    fun `creates new project`()
    {
        val mockVersionRepo = mock<VersionRepository> {
            on { getVersion("testVersion") } doReturn mockVersion
        }

        val mockProjectRepo = mock<ProjectRepository> {
            on { saveNewProject("testUser", "testProject") } doReturn 99
        }

        val sut = ProjectsController(mockSession, mockVersionRepo, mockProjectRepo, mock())

        val result = sut.newProject("testProject")

        verify(mockVersionRepo).saveVersion("testVersion", 99)

        val resultJson = parser.readTree(result.body)["data"]

        assertThat(resultJson["id"].asInt()).isEqualTo(99)
        assertThat(resultJson["name"].asText()).isEqualTo("testProject")
        val versions = resultJson["versions"] as ArrayNode
        assertThat(versions.count()).isEqualTo(1)
        assertExpectedVersion(versions[0])
    }

    @Test
    fun `copies version`()
    {
        val mockVersionRepo = mock<VersionRepository> {
            on { getVersion("testVersion") } doReturn mockVersion
        }
        val sut = ProjectsController(mockSession, mockVersionRepo, mock(), mock())
        val result = sut.newVersion(99, "parentVersion")

        verify(mockVersionRepo).copyVersion("parentVersion", "testVersion", 99, "testUser")

        val resultJson = parser.readTree(result.body)["data"]
        assertExpectedVersion(resultJson)
    }

    @Test
    fun `gets Projects`()
    {
        val mockVersions = listOf(Version("testVersion", "createdTime", "updatedTime", 1))
        val mockProjects = listOf(Project(99, "testProject", mockVersions))
        val mockProjectRepo = mock<ProjectRepository> {
            on { getProjects("testUser") } doReturn mockProjects
        }

        val sut = ProjectsController(mockSession, mock(), mockProjectRepo, mock())
        val result = sut.getProjects()

        val resultJson = parser.readTree(result.body)["data"]
        val projects = resultJson as ArrayNode
        assertThat(projects.count()).isEqualTo(1)
        assertThat(projects[0]["id"].asInt()).isEqualTo(99)
        assertThat(projects[0]["name"].asText()).isEqualTo("testProject")
        val versions = projects[0]["versions"] as ArrayNode
        assertThat(versions.count()).isEqualTo(1)
        assertExpectedVersion(versions[0])
    }

    @Test
    fun `gets current Project`()
    {
        val mockVersion = Version("testVersion", "createdTime", "updatedTime", 1)
        val mockProject = Project(99, "testProject", listOf(mockVersion))
        val mockProjectRepo = mock<ProjectRepository> {
            on { getProjectFromVersionId("testVersion", "testUser") } doReturn mockProject
        }
        val mockVersionRepo = mock<VersionRepository> {
            on { versionExists("testVersion", "testUser") } doReturn true
            on { getVersion("testVersion") } doReturn mockVersion
        }

        val sut = ProjectsController(mockSession, mockVersionRepo, mockProjectRepo, mock())
        val result = sut.getCurrentProject()

        val resultJson = parser.readTree(result.body)["data"]
        val projectNode = resultJson["project"]
        val versionNode = resultJson["version"]
        assertThat(projectNode["id"].asInt()).isEqualTo(99)
        assertThat(projectNode["name"].asText()).isEqualTo("testProject")
        assertThat(versionNode["id"].asText()).isEqualTo("testVersion")
    }

    @Test
    fun `returns null when no current Project`()
    {
        val mockVersionRepo = mock<VersionRepository> {
            on { versionExists("testVersion", "testUser") } doReturn false
        }

        val sut = ProjectsController(mockSession, mockVersionRepo, mock(), mock())
        val result = sut.getCurrentProject()

        val resultJson = parser.readTree(result.body)["data"]
        val projectNode = resultJson["project"]
        val versionNode = resultJson["version"]
        assertThat(projectNode is NullNode).isEqualTo(true)
        assertThat(versionNode is NullNode).isEqualTo(true)
    }

    @Test
    fun `returns 401 status if user is guest`()
    {
        val guestSession = mock<Session> {
            on { userIsGuest() } doReturn true
        }
        val sut = ProjectsController(guestSession, mock(), mock(), mock())
        val result = sut.getProjects()

        assertThat(result.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

    @Test
    fun `can upload state`()
    {
        val mockRepo = mock<VersionRepository>();
        val sut = ProjectsController(mockSession, mockRepo, mock(), mock())

        val result = sut.uploadState(99, "testVersion", "testState")

        verify(mockRepo).saveVersionState("testVersion", 99, "testUser", "testState")

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can get version details`()
    {
        val mockDetails = VersionDetails("TEST STATE", mapOf("pjnz" to VersionFile("hash1", "filename1", false)))
        val mockRepo = mock<VersionRepository> {
            on { getVersionDetails("testVersion", 99, "testUser") } doReturn mockDetails
        };

        val sut = ProjectsController(mockSession, mockRepo, mock(), mock())
        val result = sut.loadVersionDetails(99, "testVersion")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val resultJson = parser.readTree(result.body)["data"]
        assertThat(resultJson["state"].asText()).isEqualTo("TEST STATE");
        val filesJson = resultJson["files"]
        assertThat(filesJson["pjnz"]["hash"].asText()).isEqualTo("hash1")
        assertThat(filesJson["pjnz"]["filename"].asText()).isEqualTo("filename1")
        assertThat(filesJson["pjnz"]["fromADR"].asBoolean()).isEqualTo(false)

        verify(mockSession).setVersionId("testVersion")
    }

    @Test
    fun `can clone project to user`()
    {
        val mockVersionRepo = mock<VersionRepository>()
        val mockProjectRepo = mock<ProjectRepository> {
            on { getProject(1, "testUser") } doReturn Project(1, "p1", listOf(Version("v1", "createdTime", "updatedTime", 1),
                    Version("v2", "createdTime", "updatedTime", 1)))
            on { saveNewProject("uid1", "p1") } doReturn 2
            on { saveNewProject("uid2", "p1") } doReturn 3
        }
        val mockLogic = mock<UserLogic> {
            on { getUser("new.user@email.com") } doReturn CommonProfile().apply { id = "uid1" }
            on { getUser("a.user@email.com") } doReturn CommonProfile().apply { id = "uid2" }
        }
        val sut = ProjectsController(mockSession, mockVersionRepo, mockProjectRepo, mockLogic)
        sut.cloneProjectToUser(1, listOf("new.user@email.com", "a.user@email.com"))

        verify(mockVersionRepo).cloneVersion("v1", "testVersion", 2)
        verify(mockVersionRepo).cloneVersion("v2", "testVersion", 2)

        verify(mockVersionRepo).cloneVersion("v1", "testVersion", 3)
        verify(mockVersionRepo).cloneVersion("v2", "testVersion", 3)
    }

    @Test
    fun `clone project to user throws if any user does not exist`()
    {
        val mockLogic = mock<UserLogic> {
            on { getUser("a.user@email.com") } doReturn CommonProfile().apply { id = "1" }
            on { getUser("new.user@email.com") } doReturn null as CommonProfile?
        }
        val mockRepo = mock<ProjectRepository>()
        val sut = ProjectsController(mockSession, mock(), mockRepo, mockLogic)
        val userList = listOf("a.user@email.com", "new.user@email.com")
        assertThatThrownBy { sut.cloneProjectToUser(1, userList) }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("userDoesNotExist")
        verify(mockRepo, Times(0)).saveNewProject(any(), any())

    }

    @Test
    fun `can delete version`()
    {
        val mockRepo = mock<VersionRepository>()
        val sut = ProjectsController(mockSession, mockRepo, mock(), mock())
        val result = sut.deleteVersion(1, "testVersion")

        verify(mockRepo).deleteVersion("testVersion", 1, "testUser")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `deleting current version clears current version`()
    {
        val mockRepo = mock<VersionRepository>()
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { getVersionId() } doReturn "testVersion"
        }
        val sut = ProjectsController(mockSession, mockRepo, mock(), mock())
        val result = sut.deleteVersion(1, "testVersion")

        verify(mockRepo).deleteVersion("testVersion", 1, "testUser")
        verify(mockSession).setVersionId(null)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `deleting non-current version does not clear current version`()
    {
        val mockRepo = mock<VersionRepository>()
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { getVersionId() } doReturn "testVersion"
        }
        val sut = ProjectsController(mockSession, mockRepo, mock(), mock())
        val result = sut.deleteVersion(1, "anotherVersion")

        verify(mockRepo).deleteVersion("anotherVersion", 1, "testUser")
        verify(mockSession, Times(0)).setVersionId(null)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can delete project`()
    {
        val mockRepo = mock<ProjectRepository>() {
            on { getProjectFromVersionId("testVersion", "testUser") } doReturn Project(123, "project", listOf())
        }
        val sut = ProjectsController(mockSession, mock(), mockRepo, mock())
        val result = sut.deleteProject(1)

        verify(mockRepo).deleteProject(1, "testUser")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `deleting parent project of current version clears current version`()
    {
        val mockRepo = mock<ProjectRepository>() {
            on { getProjectFromVersionId("testVersion", "testUser") } doReturn Project(123, "project", listOf())
        }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { getVersionId() } doReturn "testVersion"
        }

        val sut = ProjectsController(mockSession, mock(), mockRepo, mock())
        val result = sut.deleteProject(123)

        verify(mockRepo).deleteProject(123, "testUser")
        verify(mockSession).setVersionId(null)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `deleting project unrelated to current version does not clear current version`()
    {
        val mockRepo = mock<ProjectRepository>() {
            on { getProjectFromVersionId("testVersion", "testUser") } doReturn Project(345, "project", listOf())
        }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { getVersionId() } doReturn "testVersion"
        }

        val sut = ProjectsController(mockSession, mock(), mockRepo, mock())
        val result = sut.deleteProject(123)

        verify(mockRepo).deleteProject(123, "testUser")
        verify(mockSession, Times(0)).setVersionId(null)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `promotes version to project`()
    {
        val mockVersionRepo = mock<VersionRepository>()
        val mockProjectRepo = mock<ProjectRepository> {
            on { getProject(1, "testUser") } doReturn Project(1, "p1", listOf(Version("v1", "createdTime", "updatedTime", 1),
                    Version("v2", "createdTime", "updatedTime", 1)))
        }
        val sut = ProjectsController(mockSession, mockVersionRepo, mockProjectRepo, mock())
        val result = sut.promoteVersion(1, "testVersion", "newProjectName")

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockProjectRepo).saveNewProject("testUser", "newProjectName")
        verify(mockVersionRepo).promoteVersion("testVersion", "testVersion", 0, "testUser")
        verify(mockVersionRepo).getVersion("testVersion")
    }

    @Test
    fun `can rename project`()
    {
        val mockRepo = mock<ProjectRepository>() {
            on { getProjectFromVersionId("testVersion", "testUser") } doReturn Project(123, "project", listOf())
        }
        val sut = ProjectsController(mockSession, mock(), mockRepo, mock())
        val result = sut.renameProject(1, "renamedProject")

        verify(mockRepo).renameProject(1, "testUser", "renamedProject")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }


    private fun assertExpectedVersion(node: JsonNode)
    {
        assertThat(node["id"].asText()).isEqualTo("testVersion")
        assertThat(node["created"].asText()).isEqualTo("createdTime")
        assertThat(node["updated"].asText()).isEqualTo("updatedTime")
    }
}
