module.exports = {
    "setupFiles": ["./src/tests/setup.ts", "jest-canvas-mock"],
    "testURL": "http://localhost",
    "globals": {
        "ts-jest": {
            tsConfig: 'tsconfig.json',
            "diagnostics": {
                "warnOnly": false
            }
        }
    },
    "testResultsProcessor": "jest-teamcity-reporter",
    "moduleFileExtensions": [
        "js",
        "json",
        "vue",
        "ts"
    ],
    "transform": {
        ".*\\.(vue)$": "vue-jest",
        "^.+\\.ts?$": "ts-jest",
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
    },
    "coverageDirectory": "./coverage/",
    "collectCoverage": true,
    "coveragePathIgnorePatterns": [
        "/node_modules/",
        "./tests/mocks.ts",
        "./tests/mutationTestHelper.ts",
        "./tests/.*/helpers.ts"
    ]
};
