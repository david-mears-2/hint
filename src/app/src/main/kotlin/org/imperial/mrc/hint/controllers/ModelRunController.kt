package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.models.ModelRunOptions
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/model")
class ModelRunController(val fileManager: FileManager, val apiClient: APIClient) {

    @PostMapping("/run/")
    @ResponseBody
    fun run(@RequestBody modelRunOptions: ModelRunOptions): ResponseEntity<String> {
        val allFiles = fileManager.getAllHashes()
        return apiClient.submit(allFiles, modelRunOptions)
    }

    @GetMapping("/status/{id}")
    @ResponseBody
    fun status(@PathVariable("id") id: String): ResponseEntity<String> {
        return apiClient.getStatus(id)
    }

    @GetMapping("/result/{id}")
    @ResponseBody
    fun result(@PathVariable("id") id: String): ResponseEntity<String> {
        return apiClient.getResult(id)
    }

    @GetMapping("/options/")
    @ResponseBody
    fun options(): ResponseEntity<String> {
        val allFiles = fileManager.getFiles(FileType.Shape, FileType.Survey, FileType.Programme, FileType.ANC)
        return apiClient.getModelRunOptions(allFiles)
    }
}
