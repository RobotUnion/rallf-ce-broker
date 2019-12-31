module.exports = {
    q: {
        API_ERROR: 'api-logs:error',
        API_IN: 'api-logs:in',
        API_OUT: 'api-logs:out',
    },
    RCP_ERRORS: {
        PARSE: -32700,	//Parse error	Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.
        INVALID_REQ: -32600,	//Invalid Request	The JSON sent is not a valid Request object.
        METHOD_NOT_FOUND: -32601,	//Method not found	The method does not exist / is not available.
        INVALID_PARAMS: -32602,	//Invalid params	Invalid method parameter(s).
        INTERNAL: -32603,	//Internal error	Internal JSON -RPC error.
        OTHER: -32000, //to - 32099	Server error	Reserved for implementation - defined server - errors.
    }
};