module.exports = {
    "setupFiles": ["./src/tests/setup.ts", "jest-canvas-mock"],
    "testURL": "http://localhost",
    "globals": {
        "currentUser": "some.user@example.com",
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
    "moduleNameMapper": {
        'd3-format': '<rootDir>/node_modules/d3-format/dist/d3-format.min.js',
    },
    "coverageDirectory": "./coverage/",
    "collectCoverage": true,
    "coveragePathIgnorePatterns": [
        "/node_modules/",
        "./tests/mocks.ts",
        "./tests/testHelpers.ts",
        "./tests/.*/helpers.ts"
    ]
};
