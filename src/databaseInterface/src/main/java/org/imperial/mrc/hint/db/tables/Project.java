/*
 * This file is generated by jOOQ.
 */
package org.imperial.mrc.hint.db.tables;


import java.util.Arrays;
import java.util.List;

import org.imperial.mrc.hint.db.Keys;
import org.imperial.mrc.hint.db.Public;
import org.imperial.mrc.hint.db.tables.records.ProjectRecord;
import org.jooq.Field;
import org.jooq.ForeignKey;
import org.jooq.Identity;
import org.jooq.Name;
import org.jooq.Record;
import org.jooq.Row6;
import org.jooq.Schema;
import org.jooq.Table;
import org.jooq.TableField;
import org.jooq.TableOptions;
import org.jooq.UniqueKey;
import org.jooq.impl.DSL;
import org.jooq.impl.SQLDataType;
import org.jooq.impl.TableImpl;


/**
 * This class is generated by jOOQ.
 */
@SuppressWarnings({ "all", "unchecked", "rawtypes" })
public class Project extends TableImpl<ProjectRecord> {

    private static final long serialVersionUID = 1L;

    /**
     * The reference instance of <code>public.project</code>
     */
    public static final Project PROJECT = new Project();

    /**
     * The class holding records for this type
     */
    @Override
    public Class<ProjectRecord> getRecordType() {
        return ProjectRecord.class;
    }

    /**
     * The column <code>public.project.id</code>.
     */
    public final TableField<ProjectRecord, Integer> ID = createField(DSL.name("id"), SQLDataType.INTEGER.nullable(false).identity(true), this, "");

    /**
     * The column <code>public.project.user_id</code>.
     */
    public final TableField<ProjectRecord, String> USER_ID = createField(DSL.name("user_id"), SQLDataType.CLOB, this, "");

    /**
     * The column <code>public.project.name</code>.
     */
    public final TableField<ProjectRecord, String> NAME = createField(DSL.name("name"), SQLDataType.CLOB.nullable(false), this, "");

    /**
     * The column <code>public.project.note</code>.
     */
    public final TableField<ProjectRecord, String> NOTE = createField(DSL.name("note"), SQLDataType.CLOB, this, "");

    /**
     * The column <code>public.project.shared_by</code>.
     */
    public final TableField<ProjectRecord, String> SHARED_BY = createField(DSL.name("shared_by"), SQLDataType.CLOB, this, "");

    /**
     * The column <code>public.project.is_uploaded</code>.
     */
    public final TableField<ProjectRecord, Boolean> IS_UPLOADED = createField(DSL.name("is_uploaded"), SQLDataType.BOOLEAN.defaultValue(DSL.field("false", SQLDataType.BOOLEAN)), this, "");

    private Project(Name alias, Table<ProjectRecord> aliased) {
        this(alias, aliased, null);
    }

    private Project(Name alias, Table<ProjectRecord> aliased, Field<?>[] parameters) {
        super(alias, null, aliased, parameters, DSL.comment(""), TableOptions.table());
    }

    /**
     * Create an aliased <code>public.project</code> table reference
     */
    public Project(String alias) {
        this(DSL.name(alias), PROJECT);
    }

    /**
     * Create an aliased <code>public.project</code> table reference
     */
    public Project(Name alias) {
        this(alias, PROJECT);
    }

    /**
     * Create a <code>public.project</code> table reference
     */
    public Project() {
        this(DSL.name("project"), null);
    }

    public <O extends Record> Project(Table<O> child, ForeignKey<O, ProjectRecord> key) {
        super(child, key, PROJECT);
    }

    @Override
    public Schema getSchema() {
        return Public.PUBLIC;
    }

    @Override
    public Identity<ProjectRecord, Integer> getIdentity() {
        return (Identity<ProjectRecord, Integer>) super.getIdentity();
    }

    @Override
    public UniqueKey<ProjectRecord> getPrimaryKey() {
        return Keys.PROJECT_PKEY;
    }

    @Override
    public List<UniqueKey<ProjectRecord>> getKeys() {
        return Arrays.<UniqueKey<ProjectRecord>>asList(Keys.PROJECT_PKEY);
    }

    @Override
    public List<ForeignKey<ProjectRecord, ?>> getReferences() {
        return Arrays.<ForeignKey<ProjectRecord, ?>>asList(Keys.PROJECT__PROJECT_USER_ID_FKEY, Keys.PROJECT__PROJECT_SHARED_BY_FKEY);
    }

    private transient Users _projectUserIdFkey;
    private transient Users _projectSharedByFkey;

    public Users projectUserIdFkey() {
        if (_projectUserIdFkey == null)
            _projectUserIdFkey = new Users(this, Keys.PROJECT__PROJECT_USER_ID_FKEY);

        return _projectUserIdFkey;
    }

    public Users projectSharedByFkey() {
        if (_projectSharedByFkey == null)
            _projectSharedByFkey = new Users(this, Keys.PROJECT__PROJECT_SHARED_BY_FKEY);

        return _projectSharedByFkey;
    }

    @Override
    public Project as(String alias) {
        return new Project(DSL.name(alias), this);
    }

    @Override
    public Project as(Name alias) {
        return new Project(alias, this);
    }

    /**
     * Rename this table
     */
    @Override
    public Project rename(String name) {
        return new Project(DSL.name(name), null);
    }

    /**
     * Rename this table
     */
    @Override
    public Project rename(Name name) {
        return new Project(name, null);
    }

    // -------------------------------------------------------------------------
    // Row6 type methods
    // -------------------------------------------------------------------------

    @Override
    public Row6<Integer, String, String, String, String, Boolean> fieldsRow() {
        return (Row6) super.fieldsRow();
    }
}
