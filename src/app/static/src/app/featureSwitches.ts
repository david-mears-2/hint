const urlParams = new URLSearchParams(window.location.search);
const modelBugReport = !urlParams.get('modelBugReport');
const modelCalibratePlot = !urlParams.get('modelCalibratePlot');
const comparisonOutput = !!urlParams.get('comparisonOutput');
const comparisonPlot = !!urlParams.get('comparisonPlot');

export const switches = {
    modelBugReport,
    modelCalibratePlot,
    comparisonOutput,
    comparisonPlot
};
