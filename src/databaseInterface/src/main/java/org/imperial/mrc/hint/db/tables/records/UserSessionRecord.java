/*
 * This file is generated by jOOQ.
*/
package org.imperial.mrc.hint.db.tables.records;


import java.sql.Timestamp;

import javax.annotation.Generated;

import org.imperial.mrc.hint.db.tables.UserSession;
import org.jooq.Field;
import org.jooq.Record1;
import org.jooq.Record8;
import org.jooq.Row8;
import org.jooq.impl.UpdatableRecordImpl;


/**
 * This class is generated by jOOQ.
 */
@Generated(
    value = {
        "http://www.jooq.org",
        "jOOQ version:3.10.5"
    },
    comments = "This class is generated by jOOQ"
)
@SuppressWarnings({ "all", "unchecked", "rawtypes" })
public class UserSessionRecord extends UpdatableRecordImpl<UserSessionRecord> implements Record8<String, String, Integer, String, String, Timestamp, Timestamp, Boolean> {

    private static final long serialVersionUID = 1892662125;

    /**
     * Setter for <code>public.user_session.session</code>.
     */
    public void setSession(String value) {
        set(0, value);
    }

    /**
     * Getter for <code>public.user_session.session</code>.
     */
    public String getSession() {
        return (String) get(0);
    }

    /**
     * Setter for <code>public.user_session.user_id</code>.
     */
    public void setUserId(String value) {
        set(1, value);
    }

    /**
     * Getter for <code>public.user_session.user_id</code>.
     */
    public String getUserId() {
        return (String) get(1);
    }

    /**
     * Setter for <code>public.user_session.version_id</code>.
     */
    public void setVersionId(Integer value) {
        set(2, value);
    }

    /**
     * Getter for <code>public.user_session.version_id</code>.
     */
    public Integer getVersionId() {
        return (Integer) get(2);
    }

    /**
     * Setter for <code>public.user_session.state</code>.
     */
    public void setState(String value) {
        set(3, value);
    }

    /**
     * Getter for <code>public.user_session.state</code>.
     */
    public String getState() {
        return (String) get(3);
    }

    /**
     * Setter for <code>public.user_session.note</code>.
     */
    public void setNote(String value) {
        set(4, value);
    }

    /**
     * Getter for <code>public.user_session.note</code>.
     */
    public String getNote() {
        return (String) get(4);
    }

    /**
     * Setter for <code>public.user_session.created</code>.
     */
    public void setCreated(Timestamp value) {
        set(5, value);
    }

    /**
     * Getter for <code>public.user_session.created</code>.
     */
    public Timestamp getCreated() {
        return (Timestamp) get(5);
    }

    /**
     * Setter for <code>public.user_session.updated</code>.
     */
    public void setUpdated(Timestamp value) {
        set(6, value);
    }

    /**
     * Getter for <code>public.user_session.updated</code>.
     */
    public Timestamp getUpdated() {
        return (Timestamp) get(6);
    }

    /**
     * Setter for <code>public.user_session.deleted</code>.
     */
    public void setDeleted(Boolean value) {
        set(7, value);
    }

    /**
     * Getter for <code>public.user_session.deleted</code>.
     */
    public Boolean getDeleted() {
        return (Boolean) get(7);
    }

    // -------------------------------------------------------------------------
    // Primary key information
    // -------------------------------------------------------------------------

    /**
     * {@inheritDoc}
     */
    @Override
    public Record1<String> key() {
        return (Record1) super.key();
    }

    // -------------------------------------------------------------------------
    // Record8 type implementation
    // -------------------------------------------------------------------------

    /**
     * {@inheritDoc}
     */
    @Override
    public Row8<String, String, Integer, String, String, Timestamp, Timestamp, Boolean> fieldsRow() {
        return (Row8) super.fieldsRow();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Row8<String, String, Integer, String, String, Timestamp, Timestamp, Boolean> valuesRow() {
        return (Row8) super.valuesRow();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<String> field1() {
        return UserSession.USER_SESSION.SESSION;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<String> field2() {
        return UserSession.USER_SESSION.USER_ID;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<Integer> field3() {
        return UserSession.USER_SESSION.VERSION_ID;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<String> field4() {
        return UserSession.USER_SESSION.STATE;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<String> field5() {
        return UserSession.USER_SESSION.NOTE;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<Timestamp> field6() {
        return UserSession.USER_SESSION.CREATED;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<Timestamp> field7() {
        return UserSession.USER_SESSION.UPDATED;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Field<Boolean> field8() {
        return UserSession.USER_SESSION.DELETED;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String component1() {
        return getSession();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String component2() {
        return getUserId();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Integer component3() {
        return getVersionId();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String component4() {
        return getState();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String component5() {
        return getNote();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Timestamp component6() {
        return getCreated();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Timestamp component7() {
        return getUpdated();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Boolean component8() {
        return getDeleted();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String value1() {
        return getSession();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String value2() {
        return getUserId();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Integer value3() {
        return getVersionId();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String value4() {
        return getState();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String value5() {
        return getNote();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Timestamp value6() {
        return getCreated();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Timestamp value7() {
        return getUpdated();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Boolean value8() {
        return getDeleted();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value1(String value) {
        setSession(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value2(String value) {
        setUserId(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value3(Integer value) {
        setVersionId(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value4(String value) {
        setState(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value5(String value) {
        setNote(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value6(Timestamp value) {
        setCreated(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value7(Timestamp value) {
        setUpdated(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord value8(Boolean value) {
        setDeleted(value);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserSessionRecord values(String value1, String value2, Integer value3, String value4, String value5, Timestamp value6, Timestamp value7, Boolean value8) {
        value1(value1);
        value2(value2);
        value3(value3);
        value4(value4);
        value5(value5);
        value6(value6);
        value7(value7);
        value8(value8);
        return this;
    }

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    /**
     * Create a detached UserSessionRecord
     */
    public UserSessionRecord() {
        super(UserSession.USER_SESSION);
    }

    /**
     * Create a detached, initialised UserSessionRecord
     */
    public UserSessionRecord(String session, String userId, Integer versionId, String state, String note, Timestamp created, Timestamp updated, Boolean deleted) {
        super(UserSession.USER_SESSION);

        set(0, session);
        set(1, userId);
        set(2, versionId);
        set(3, state);
        set(4, note);
        set(5, created);
        set(6, updated);
        set(7, deleted);
    }
}
