package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.models.CalibrateResultRow
import org.springframework.stereotype.Component
import java.sql.*
import java.util.*

const val INDICATOR_QUERY = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper,
area_level,
FROM data WHERE indicator=?"""

const val DEFAULT_QUERY = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper,
area_level,
FROM data"""

interface CalibrateDataRepository
{
    fun getDataFromPath(
        path: String,
        indicator: String): List<CalibrateResultRow>
}

@Component
class JooqCalibrateDataRepository: CalibrateDataRepository
{
    private fun convertDataToArrayList(resultSet: ResultSet): List<CalibrateResultRow> {
            resultSet.use {
            return generateSequence {
                if (it.next()) {
                    CalibrateResultRow(
                        it.getString("indicator"),
                        it.getString("calendar_quarter"),
                        it.getString("age_group"),
                        it.getString("sex"),
                        it.getString("area_id"),
                        it.getFloat("mode"),
                        it.getFloat("mean"),
                        it.getFloat("lower"),
                        it.getFloat("upper"),
                        it.getInt("area_level")
                    )
                } else {
                    null
                }
            }.toList()
        }
    }

    private fun getDataFromConnection(
        conn: Connection,
        indicator: String): List<CalibrateResultRow> {
        val resultSet: ResultSet
        if (indicator == "all") {
            val query = DEFAULT_QUERY
            val stmt: Statement = conn.createStatement()
            resultSet = stmt.executeQuery(query)
        } else {
            val stmt: PreparedStatement = conn.prepareStatement(INDICATOR_QUERY)
            stmt.setString(1, indicator)
            resultSet = stmt.executeQuery()
        }
        
        val arrayList = convertDataToArrayList(resultSet)
        return arrayList
    }

    private fun getDBConnFromPathResponse(path: String): Connection {   
        val readOnlyProp = Properties()
        readOnlyProp.setProperty("duckdb.read_only", "true")
        val conn = DriverManager.getConnection("jdbc:duckdb:.${path}", readOnlyProp)
        return conn
    }

    override fun getDataFromPath(
        path: String,
        indicator: String): List<CalibrateResultRow>
    {
        getDBConnFromPathResponse(path).use { conn ->
            return getDataFromConnection(conn, indicator)
        }
    }
}
