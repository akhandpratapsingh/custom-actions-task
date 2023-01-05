/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(560);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;