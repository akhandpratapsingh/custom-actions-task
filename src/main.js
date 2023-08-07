const core = require('@actions/core');
const axios = require('axios');
const fs = require('fstream');

(async function main() {
    let instanceUrl = core.getInput('instance-url', { required: true });
    const toolId = core.getInput('tool-id', { required: true });
    const username = core.getInput('devops-integration-user-name');
    const password = core.getInput('devops-integration-user-password');
    const token = core.getInput('devops-integration-token', { required: false });
    const jobname = core.getInput('job-name', { required: true });
    const filePath = core.getInput('file-path', { required: true });
    const modelId = core.getInput('model-id', { required: true });

    let githubContext = core.getInput('context-github', { required: true });

    try {
        githubContext = JSON.parse(githubContext);
    } catch (e) {
        core.setFailed(`Exception parsing github context ${e}`);
    }

    // File Stream
    let fileStreamData;
    try {
        fileStreamData = fs.Reader(filePath);
    } catch (e) {
        core.setFailed(`${filePath} path is incorrect or the file does not exist: ${e}`);
        return;
    }

    let httpHeaders;
    let httpHeadersForStream;
    let restendpoint;
    let restendpointUploadFile;
    let uploadedFileSysId;

    try {

        //Preparing headers and endpoint Urls
        if (token === '' && username === '' && password === '') {

            console.log("I have enternted ere if ");
            core.setFailed('Either secret token or integration username, password is needed for integration user authentication');
            return;
        }
        else if (token !== '') {

            console.log("Im in token "  + username + "ppassword"+ token);

            restendpoint = `${instanceUrl}/api/sn_devops/v2/devops/tool/sbom?toolId=${toolId}`;
            restendpointUploadFile = `${instanceUrl}/api/sn_devops/v2/devops/upload?toolId=${toolId}`;

            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'sn_devops.DevOpsToken ' + `${toolId}:${token}`
            };
            const streamHeader = {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/json',
                'Authorization': 'sn_devops.DevOpsToken ' + `${toolId}:${token}`
            };
            httpHeaders = { headers: defaultHeaders };
            httpHeadersForStream = { headers: streamHeader };
        }
        else if (username !== '' && password !== '') {

            console.log("I have enternted ere else "  + username + "ppassword"+ password);

            restendpoint = `${instanceUrl}/api/sn_devops/v1/devops/tool/sbom?toolId=${toolId}`;
            restendpointUploadFile = `${instanceUrl}/api/sn_devops/v2/devops/upload?toolId=${toolId}`;
            const tokenBasicAuth = `${username}:${password}`;
            const encodedTokenForBasicAuth = Buffer.from(tokenBasicAuth).toString('base64');

            const defaultHeaders = {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + `${encodedTokenForBasicAuth}`
            };
            const streamHeader = {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + `${encodedTokenForBasicAuth}`
            };
            httpHeaders = { headers: defaultHeaders };
            httpHeadersForStream = { headers: streamHeader };
        }
        else {
            core.setFailed('For Basic Auth, Username and Password is mandatory for integration user authentication');
            return;
        }

        // API call
        responseData = await axios.post(restendpointUploadFile, fileStreamData, httpHeadersForStream);
        console.log(responseData.data);  // TO Remove

        //API response check
        if (responseData.data && responseData.data.result && 
            responseData.data.result.status === 'Success' && responseData.data.result.attachmentId){
                uploadedFileSysId = responseData.data.result.attachmentId;
                console.log(`\n \x1b[1m\x1b[32m Success: ${filePath} uploaded successfully : ${uploadedFileSysId} \x1b[0m\x1b[0m`);
        }else{
            core.setFailed(`FAILED: Sbom Scan could not be registered, failed while uploading the ${filePath}`);
        }

    } catch (e) {
        if (e.message.includes('ECONNREFUSED') || e.message.includes('ENOTFOUND') || e.message.includes('405')) {
            core.setFailed('ServiceNow Instance URL is NOT valid. Please correct the URL and try again.');
        } else if (e.message.includes('401')) {
            core.setFailed('Invalid Credentials. Please correct the credentials and try again.');
        } else {
            core.setFailed(`ServiceNow Sbom Results are NOT created. Please check ServiceNow logs for more details.`);
        }
        console.log(`FAILED: Failure while uploading the file ${filePath} : ${e}`);
        return;
    }

    let payload;

    try {
        instanceUrl = instanceUrl.trim();
        if (instanceUrl.endsWith('/'))
            instanceUrl = instanceUrl.slice(0, -1);

        pipelineInfo = {
            toolId: toolId,
            runId: `${githubContext.run_id}`,
            runNumber: `${githubContext.run_number}`,
            runAttempt: `${githubContext.run_attempt}`,
            job: `${jobname}`,
            sha: `${githubContext.sha}`,
            workflow: `${githubContext.workflow}`,
            repository: `${githubContext.repository}`,
            ref: `${githubContext.ref}`,
            refName: `${githubContext.ref_name}`,
            refType: `${githubContext.ref_type}`
        };

        sbomMetaData = {
            uploadFileId: uploadedFileSysId,
            modelId: modelId
        };

        payload = {
            pipelineInfo: pipelineInfo,
            sbomMetaData: sbomMetaData
        };
        core.debug('Sbom scan results Custon Action payload is : ${JSON.stringify(payload)}\n\n');
    } catch (e) {
        core.setFailed(`Exception setting the payload ${e}`);
        return;
    }

    try{

        // API call to register SBOM 
        responseData = await axios.post(restEndpoint, JSON.stringify(payload), httpHeaders);

        console.log(responseData.data); // TO REMOVE
        if (responseData.data && responseData.data.result)
            console.log("\n \x1b[1m\x1b[32m SUCCESS: Sbom Scan registration was successful" + '\x1b[0m\x1b[0m');
        else
            console.log("FAILED: Sbom Scan could not be registered");
    } catch (e) {
        core.setFailed(`ServiceNow Sbom Scan Results are NOT created. Please check ServiceNow logs for more details.`);
        console.log(`FAILED: ${e}`);
    }

})();
