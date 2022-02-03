package org.imperial.mrc.hint

import org.imperial.mrc.hint.security.SecurePaths
import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.web.servlet.config.annotation.*
import org.springframework.web.servlet.resource.EncodedResourceResolver
import org.springframework.web.servlet.resource.PathResourceResolver

@SpringBootApplication
class HintApplication

fun main(args: Array<String>)
{
    SpringApplication.run(HintApplication::class.java)
}

@Configuration
@EnableWebMvc
class MvcConfig(val config: Config) : WebMvcConfigurer
{
    override fun addResourceHandlers(registry: ResourceHandlerRegistry)
    {
        registry.addResourceHandler("/public/**")
                .addResourceLocations("file:/static/public/", "file:static/public/")
                .resourceChain(true)
                .addResolver(EncodedResourceResolver())
                .addResolver(PathResourceResolver())
    }

    override fun addInterceptors(registry: InterceptorRegistry)
    {
        //Ajax endpoints only available to logged in users
        registry.addInterceptor(SecurityInterceptor(config, ""))
                .addPathPatterns(SecurePaths.ADD.pathList())
                .excludePathPatterns(SecurePaths.EXCLUDE.pathList())
    }

    override fun configureAsyncSupport(configurer: AsyncSupportConfigurer)
    {
        val t = ThreadPoolTaskExecutor()
        t.corePoolSize = 10
        t.maxPoolSize = 100
        t.setQueueCapacity(50)
        t.setAllowCoreThreadTimeOut(true)
        t.keepAliveSeconds = 120
        t.initialize()
        configurer.setTaskExecutor(t)

        val timeoutMs = 10 * 60 * 1000L
        configurer.setDefaultTimeout(timeoutMs)
    }
}
