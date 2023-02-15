<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <!-- endinject -->
    <script>
        function validate(event) {
            const userIdInput = document.getElementById("user-id");
            userIdInput.value = userIdInput.value.trim();

            const form = document.getElementById("login-form");
            if (!form.checkValidity()) {
                event.preventDefault();
                form.classList.add('was-validated');
            }
        }

        function continueAsGuest() {
            sessionStorage.setItem("asGuest", "continueAsGuest")
        }

        oauth2Callback = () => {
            location.href = "/oauth2";
        }
    </script>
</head>
<body class="login-page">
    <div id="container">
        <a href="https://www.unaids.org"><img src="public/images/unaids_logo.png" class="large-logo mt-4 mb-4 mx-auto"/></a>
        <h1 class="m-0 text-center"><strong>${appTitle}</strong></h1>
        <div id="app" class="card login-form mx-auto mt-3">
            <div class="card-body mx-2">
                <#if oauth2LoginMethod>
                    <div class="text-center mt-2">
                        <input class="btn btn-red" type="submit" onclick="oauth2Callback()" value="Log in with HIV Tools Single Sign-On account">
                    </div>
                    <div id="register-oauth2-account" class="text-muted text-center mt-2">
                        Don't have an account? <a href="/register" target="_blank">Create an account</a>
                    </div>
                <#else>
                    <h2 class="text-dark mb-3">Login</h2>
                    <form id="login-form" method="post" action="/callback/formClient" class="needs-validation" novalidate
                          onsubmit="validate(event);">
                        <div class="form-group">
                            <input type="text" size="20" class="form-control" name="username" id="user-id"
                                   value="${username}" placeholder="Email" required>
                            <div id="userid-feedback" class="invalid-feedback">Please enter your username.</div>
                        </div>
                        <div class="form-group">
                            <input type="password" size="20" class="form-control" name="password" id="pw-id"
                                   placeholder="Password" required>
                            <div id="pw-feedback" class="invalid-feedback">Please enter your password.</div>
                            <div id="forgot-password" class="mt-1">
                                <a href="/password/forgot-password/">Forgotten your password?</a>
                            </div>
                        </div>
                        <div class="text-center mt-2">
                            <input class="btn btn-red" type="submit" value="Log In">
                        </div>
                    </form>
                    <#if error != "">
                        <div id="error" class="alert alert-danger mt-2">${error}</div>
                    </#if>
                    <div id="register-an-account" class="text-muted mt-1">
                        Don't have an account? <a href="https://forms.office.com/r/7S9EMigGr4" target="_blank">Create an account</a>
                    </div>
                </#if>
                <div id="continue-as-guest" class="text-center mt-2">
                    <div class="text-divider"><span class="text-muted">OR</span></div>
                    <a class="btn btn-red" onclick="continueAsGuest()" type="submit" href="${continueTo}">Continue as guest</a>
                </div>
            </div>
        </div>
        <div></div>
        <div id="partners" class="text-center text-muted mt-5">Our partners</div>
        <div class="logos mt-1">
            <a href="https://www.fjelltopp.org"><img src="public/images/fjelltopp_logo.png" class="small-logo"></a>
            <a href="https://www.imperial.ac.uk"><img src="public/images/imperial_logo.png" class="small-logo"></a>
            <a href="https://github.com/reside-ic"><img src="public/images/reside_logo.png" class="small-logo"></a>
            <a href="https://www.avenirhealth.org"><img src="public/images/avenir_logo.png" class="small-logo"></a>
            <a href="https://www.washington.edu"><img src="public/images/uw_logo.png" class="small-logo"></a>
        </div>
        <div id="spacer"></div>
        <div class="links mb-4">
            <a href="https://reside-ic.github.io/projects/naomi/" target="_blank">About</a>
            <a href="https://naomi.unaids.org/news" target="_blank">News</a>
            <a href="/privacy">Privacy</a>
            <a href="/accessibility">Accessibility</a>
        </div>
    </div>
</body>
</html>
