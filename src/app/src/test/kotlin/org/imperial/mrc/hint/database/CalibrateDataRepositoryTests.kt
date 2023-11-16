package org.imperial.mrc.hint.database

import org.imperial.mrc.hint.db.JooqCalibrateDataRepository
import org.imperial.mrc.hint.models.CalibrateResultRow
import org.junit.jupiter.api.Test
import org.jooq.tools.json.JSONArray
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.assertj.core.api.Assertions.assertThat
import com.fasterxml.jackson.databind.ObjectMapper
import java.sql.SQLException

class CalibrateDataRepositoryTests
{
    val expectedRow = JSONArray(listOf(
        CalibrateResultRow(
            "indicator_test",
            "calendar_quarter_test",
            "age_group_test",
            "sex_test",
            "area_id_test",
            0.2222,
            0.5555,
            0.1111,
            0.9999
        ),
        CalibrateResultRow(
            "indicator_test_2",
            "calendar_quarter_test",
            "age_group_test",
            "sex_test",
            "area_id_test",
            0.3333,
            0.8888,
            0.6666,
            0.4444
        ),
    ))
    val expectedRowIndicator2 = JSONArray(listOf(
        CalibrateResultRow(
            "indicator_test_2",
            "calendar_quarter_test",
            "age_group_test",
            "sex_test",
            "area_id_test",
            0.3333,
            0.8888,
            0.6666,
            0.4444
        )
    ))
    val path = "/src/test/resources/duckdb/test.duckdb"
    val sut = JooqCalibrateDataRepository()

    @Test
    fun `can get data from duckdb path with single indicator`()
    {
        val plotData = sut.getDataFromPath(path, "indicator_test_2")
        val plotDataTree = ObjectMapper().readTree(JSONArray(plotData).toString())
        val expectedTree = ObjectMapper().readTree(expectedRowIndicator2.toString())
        assert(plotDataTree.equals(expectedTree))
    }

    @Test
    fun `returns empty data if invalid indicator`()
    {
        assertThat(sut.getDataFromPath(path, "dangerous_indicator"))
            .isEqualTo(listOf<CalibrateResultRow>())
    }

    @Test
    fun `can get data from duckdb path with all indicators`()
    {
        val plotData = sut.getDataFromPath(path, "all")
        val plotDataTree = ObjectMapper().readTree(JSONArray(plotData).toString())
        val expectedTree = ObjectMapper().readTree(expectedRow.toString())
        assert(plotDataTree.equals(expectedTree))
    }

    @Test
    fun `throws error if connection is invalid`()
    {
        assertThatThrownBy {
            sut.getDataFromPath("/src/test/resources/duckdb/test1.duckdb", "all")
        }.isInstanceOf(SQLException::class.java)
            .hasMessageContaining("database does not exist")
    }
}