<h1>Run model</h1>
<runner :inputs="inputs" :running="runId && !finished" @queued="handleRun"></runner>
<status :run-id="runId" @finished="handleFinished"></status>
<results :run-id="runId" :finished="finished" :success="success"></results>
