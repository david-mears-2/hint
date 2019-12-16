import Vue from "vue";
import {StoreOptions} from "vuex";
import ForgotPassword from "./components/password/ForgotPassword.vue";
import Vuex from "vuex";
import {initialPasswordState, PasswordState} from "./store/password/password";
import {actions} from './store/password/actions';
import {mutations} from './store/password/mutations';
import registerTranslations from "./store/translations/registerTranslations";

Vue.use(Vuex);

const passwordStoreOptions: StoreOptions<PasswordState> = {
    state: initialPasswordState,
    actions,
    mutations
};

const store = new Vuex.Store<PasswordState>(passwordStoreOptions);
registerTranslations(store);

export const forgotPasswordnApp = new Vue({
    el: "#app",
    store,
    components: {
        ForgotPassword
    },
    render: h => h(ForgotPassword)
});
