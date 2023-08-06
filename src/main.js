const core = require('@actions/core');
const axios = require('axios');
const fs = require('fs-extra')
//const request = require('request');

(async function main() {
    let instanceUrl = core.getInput('instance-url', { required: true });
    const toolId = core.getInput('tool-id', { required: true });
    const username = core.getInput('devops-integration-user-name');
    const password = core.getInput('devops-integration-user-password');
    const token = core.getInput('devops-integration-token', { required: false });
    const fileName = core.getInput('file-name', { required: true });
    const jobname = core.getInput('job-name', { required: true });
    //let securityResultAttributes = core.getInput('security-result-attributes', { required: true });

    let githubContext = core.getInput('context-github', { required: true });

    try {
        githubContext = JSON.parse(githubContext);
    } catch (e) {
        core.setFailed(`Exception parsing github context ${e}`);
    }

    let fileStreamData;
    try {
        fileStreamData = fs.createReadStream(fileName);
        console.log(fileStreamData);
    } catch (e) {
        core.setFailed(`Exception creating fileStreamData ${e}`);
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

        payload = {
            pipelineInfo: pipelineInfo,
            fileStreamData: fileStreamData
        };
        console.log(JSON.stringify(payload));
        core.debug('Security scan results Custon Action payload is : ${JSON.stringify(pipelineInfo)}\n\n');
    } catch (e) {
        core.setFailed(`Exception setting the payload ${e}`);
        return;
    }

    try {
        if (token === '' && username === '' && password === '') {

            console.log("I have enternted ere if ");
            core.setFailed('Either secret token or integration username, password is needed for integration user authentication');
            return;
        }
        else if (token !== '') {

            console.log("Im in token "  + username + "ppassword"+ token);

            restendpoint = `${instanceUrl}/api/sn_devops/v2/devops/tool/security?toolId=${toolId}`;
            const defaultHeadersForToken = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'sn_devops.DevOpsToken ' + `${toolId}:${token}`
            };
            httpHeaders = { headers: defaultHeadersForToken };
        }
        else if (username !== '' && password !== '') {

            console.log("I have enternted ere else "  + username + "ppassword"+ password);

            restendpoint = `${instanceUrl}/api/sn_devops/v1/devops/tool/security?toolId=${toolId}`;
            const tokenBasicAuth = `${username}:${password}`;
            const encodedTokenForBasicAuth = Buffer.from(tokenBasicAuth).toString('base64');

            const defaultHeadersForBasicAuth = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + `${encodedTokenForBasicAuth}`
            };
            httpHeaders = { headers: defaultHeadersForBasicAuth };
        }
        else {
            core.setFailed('For Basic Auth, Username and Password is mandatory for integration user authentication');
            return;
        }


        responseData = await axios.post(restendpoint, JSON.stringify(payload), httpHeaders);

        if (responseData.data && responseData.data.result)
            console.log("\n \x1b[1m\x1b[32m SUCCESS: Security Scan registration was successful" + '\x1b[0m\x1b[0m');
        else
            console.log("FAILED: Security Scan could not be registered");
    } catch (e) {
        if (e.message.includes('ECONNREFUSED') || e.message.includes('ENOTFOUND') || e.message.includes('405')) {
            core.setFailed('ServiceNow Instance URL is NOT valid. Please correct the URL and try again.');
        } else if (e.message.includes('401')) {
            core.setFailed('Invalid Credentials. Please correct the credentials and try again.');
        } else {
            core.setFailed(`ServiceNow Software Quality Results are NOT created. Please check ServiceNow logs for more details.`);
        }
    }

})();
