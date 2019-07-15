module.exports = {
    "testResultsProcessor": "jest-teamcity-reporter",
    "moduleFileExtensions": [
        "js",
        "json",
        "vue"
    ],
    "transform": {
        ".*\\.(vue)$": "vue-jest",
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
    },
    "coverageDirectory": "./coverage/",
    "collectCoverage": true
};
