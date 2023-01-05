/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 442:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(105);
const axios = __nccwpck_require__(512);

async function createChange({
  instanceUrl,
  toolId,
  username,
  passwd,
  jobname,
  githubContextStr,
  changeRequestDetailsStr
}) {
   
    console.log('Calling Change Control API to create change....');
    
    let changeRequestDetails;
    let attempts = 0;

    try {
      changeRequestDetails = JSON.parse(changeRequestDetailsStr);
    } catch (e) {
        console.log(`Error occured with message ${e}`);
        throw new Error("Failed parsing changeRequestDetails");
    }

    let githubContext;

    try {
        githubContext = JSON.parse(githubContextStr);
    } catch (e) {
        console.log(`Error occured with message ${e}`);
        throw new Error("Exception parsing github context");
    }

    let payload;
    
    try {
        payload = {
            'toolId': toolId,
            'stageName': jobname,
            'buildNumber': `${githubContext.run_id}`,
            'attemptNumber': `${githubContext.run_attempt}`,
            'sha': `${githubContext.sha}`,
            'action': 'customChange',
            'workflow': `${githubContext.workflow}`,
            'repository': `${githubContext.repository}`,
            'branchName': `${githubContext.ref_name}`,
            'changeRequestDetails': changeRequestDetails
        };
    } catch (err) {
        console.log(`Error occured with message ${err}`);
        throw new Error("Exception preparing payload");
    }

    const postendpoint = `${instanceUrl}/api/sn_devops/devops/orchestration/changeControl?toolId=${toolId}&toolType=github_server`;
    let response;
    let status = false;

    while (attempts < 3) {
        try {
            ++attempts;
            const token = `${username}:${passwd}`;
            const encodedToken = Buffer.from(token).toString('base64');

            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + `${encodedToken}`
            };
            let httpHeaders = { headers: defaultHeaders };
            response = await axios.post(postendpoint, JSON.stringify(payload), httpHeaders);
            status = true;
            break;
        } catch (err) {
            if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
                throw new Error('Invalid ServiceNow Instance URL. Please correct the URL and try again.');
            }
            
            if (err.message.includes('401')) {
                throw new Error('Invalid Credentials. Please correct the credentials and try again.');
            }
               
            if (err.message.includes('405')) {
                throw new Error('Response Code from ServiceNow is 405. Please correct ServiceNow logs for more details.');
            }

            if (!err.response) {
                throw new Error('No response from ServiceNow. Please check ServiceNow logs for more details.');
            }

            if (err.response.status == 500) {
                throw new Error('Response Code from ServiceNow is 500. Please check ServiceNow logs for more details.')
            }
            
            if (err.response.status == 400) {
                let errMsg = 'ServiceNow DevOps Change is not created. Please check ServiceNow logs for more details.';
                let responseData = err.response.data;
                if (responseData && responseData.error && responseData.error.message) {
                    errMsg = responseData.error.message;
                } else if (responseData && responseData.result && responseData.result.details && responseData.result.details.errors) {
                    errMsg = 'ServiceNow DevOps Change is not created. ';
                    let errors = err.response.data.result.details.errors;
                    for (var index in errors) {
                        errMsg = errMsg + errors[index].message;
                    }
                }
                if (errMsg.indexOf('callbackURL') == -1)
                    throw new Error(errMsg);
                else if (attempts >= 3) {
                    errMsg = 'Task/Step Execution not created in ServiceNow DevOps for this job/stage ' + jobname + '. Please check Inbound Events processing details in ServiceNow instance and ServiceNow logs for more details.';
                    throw new Error(errMsg);
                }
            }
            await new Promise((resolve) => setTimeout(resolve, 30000));
        }
    }
    if (status) {
        var result = response.data.result;
        if (result && result.message) {
            console.log('\n     \x1b[1m\x1b[36m'+result.message+'\x1b[0m\x1b[0m');
        }
    }
}

module.exports = { createChange };

/***/ }),

/***/ 560:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(105);
const axios = __nccwpck_require__(512);

async function doFetch({
  instanceUrl,
  toolId,
  username,
  passwd,
  jobname,
  githubContextStr
}) {
    console.log(`\nPolling for change status..........`);

    let githubContext = JSON.parse(githubContextStr);
    
    const codesAllowedArr = '200,201,400,401,403,404,500'.split(',').map(Number);
    const pipelineName = `${githubContext.repository}` + '/' + `${githubContext.workflow}`;
    const buildNumber = `${githubContext.run_id}`;
    const attemptNumber = `${githubContext.run_attempt}`;

    const endpoint = `${instanceUrl}/api/sn_devops/devops/orchestration/changeStatus?toolId=${toolId}&stageName=${jobname}&pipelineName=${pipelineName}&buildNumber=${buildNumber}&attemptNumber=${attemptNumber}`;
    
    let response = {};
    let status = false;
    let changeStatus = {};
    let responseCode = 500;

    try {
        const token = `${username}:${passwd}`;
        const encodedToken = Buffer.from(token).toString('base64');

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Basic ' + `${encodedToken}`
        };

        let httpHeaders = { headers: defaultHeaders };
        response = await axios.get(endpoint, httpHeaders);
        status = true;
    } catch (err) {
        if (!err.response) {
           throw new Error("500");
        }

        if (!codesAllowedArr.includes(err.response.status)) {
          throw new Error("500");
        }
   
        if (err.response.status == 500) {
            throw new Error("500");
        }

        if (err.response.status == 400) {
          throw new Error("400");
        }

        if (err.response.status == 401) {
          throw new Error("401");
        }

        if (err.response.status == 403) {
          throw new Error("403");
        }

        if (err.response.status == 404) {
          throw new Error("404");
        }
    }

    if (status) {
        try {
          responseCode = response.status;
        } catch (error) {
            core.setFailed('\nCould not read response code from API response: ' + error);
            throw new Error("500");
        }

        try {
          changeStatus = response.data.result;
        } catch (error) {
            core.setFailed('\nCould not read change status details from API response: ' + error);
            throw new Error("500");
        }

        let details =  changeStatus.details;
        console.log('\n     \x1b[1m\x1b[32m'+JSON.stringify(details)+'\x1b[0m\x1b[0m');

        let changeState =  details.status;

        if (responseCode == 201) {
          if (changeState == "pending_decision") {
            throw new Error("201");
          } else
            throw new Error("202");
        }

        if (responseCode == 200) {
            console.log('\n****Change is Approved.');
        }
    } else
        throw new Error("500");

    return true;
}

module.exports = { doFetch };

/***/ }),

/***/ 970:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(105);
const { doFetch } = __nccwpck_require__(560);

async function tryFetch({
  start = +new Date(),
  interval,
  timeout,
  instanceUrl,
  toolId,
  username,
  passwd,
  jobname,
  githubContextStr
}) {
    try {
        await doFetch({
          instanceUrl,
          toolId,
          username,
          passwd,
          jobname,
          githubContextStr
        });
    } catch (error) {
        if (error.message == "500") {
          throw new Error(`Internal server error. An unexpected error occurred while processing the request.`);
        }

        if (error.message == "400") {
          throw new Error(`Bad Request. Missing inputs to process the request.`);
        }

        if (error.message == "401") {
          throw new Error(`The user credentials are incorrect.`);
        }

        if (error.message == "403") {
          throw new Error(`Forbidden. The user does not have the role to process the request.`);
        }

        if (error.message == "404") {
          throw new Error(`Not found. The requested item was not found.`);
        }

        if (error.message == "202") {
          throw new Error("****Change has been created but the change is either rejected or cancelled.");
        }

        if (error.message == "201") {
          console.log('\n****Change is pending for approval decision.');
        }

        // Wait and then continue
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));

        if (+new Date() - start > timeout * 1000) {
          throw new Error(`Timeout after ${timeout} seconds.`);
        }

        await tryFetch({
          start,
          interval,
          timeout,
          instanceUrl,
          toolId,
          username,
          passwd,
          jobname,
          githubContextStr
        });
    }
}

module.exports = { tryFetch };


/***/ }),

/***/ 105:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 512:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(105);
const axios = __nccwpck_require__(512);
const { createChange } = __nccwpck_require__(442);
const { tryFetch } = __nccwpck_require__(970);

const main = async() => {
  try {
    const instanceUrl = core.getInput('instance-url', { required: true });
    const toolId = core.getInput('tool-id', { required: true });
    const username = core.getInput('devops-integration-user-name', { required: true });
    const passwd = core.getInput('devops-integration-user-password', { required: true });
    const jobname = core.getInput('job-name', { required: true });

    let changeRequestDetailsStr = core.getInput('change-request', { required: true });
    let githubContextStr = core.getInput('context-github', { required: true });
    let status = true;
    let response;

    try {
      response = await createChange({
        instanceUrl,
        toolId,
        username,
        passwd,
        jobname,
        githubContextStr,
        changeRequestDetailsStr
      });
    } catch (err) {
      status = false;
      core.setFailed(err.message);
    }

    if (status) {
      let timeout = parseInt(core.getInput('timeout') || 100);
      let interval = parseInt(core.getInput('interval') || 3600);

      interval = interval>=100 ? interval : 100;
      timeout = timeout>=100? timeout : 3600;

      let start = +new Date();
      
      response = await tryFetch({
        start,
        interval,
        timeout,
        instanceUrl,
        toolId,
        username,
        passwd,
        jobname,
        githubContextStr
      });

      console.log('Get change status was successfull.');  
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
})();

module.exports = __webpack_exports__;
/******/ })()
;