"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureAction = exports.SimpleProperty = exports.ComplexProperty = exports.RequestFailed = exports.AuthenticationFailed = exports.Client = exports.leftPromiseTransformer = exports.Either = void 0;
const oauth_client_1 = require("./viessmann/oauth-client");
const viessmann_api_client_1 = require("./viessmann/viessmann-api-client");
var either_1 = require("./lib/either");
Object.defineProperty(exports, "Either", { enumerable: true, get: function () { return either_1.Either; } });
Object.defineProperty(exports, "leftPromiseTransformer", { enumerable: true, get: function () { return either_1.leftPromiseTransformer; } });
var viessmann_api_client_2 = require("./viessmann/viessmann-api-client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return viessmann_api_client_2.Client; } });
var oauth_client_2 = require("./viessmann/oauth-client");
Object.defineProperty(exports, "AuthenticationFailed", { enumerable: true, get: function () { return oauth_client_2.AuthenticationFailed; } });
Object.defineProperty(exports, "RequestFailed", { enumerable: true, get: function () { return oauth_client_2.RequestFailed; } });
var viessmann_schema_1 = require("./viessmann/viessmann-schema");
Object.defineProperty(exports, "ComplexProperty", { enumerable: true, get: function () { return viessmann_schema_1.ComplexProperty; } });
Object.defineProperty(exports, "SimpleProperty", { enumerable: true, get: function () { return viessmann_schema_1.SimpleProperty; } });
Object.defineProperty(exports, "FeatureAction", { enumerable: true, get: function () { return viessmann_schema_1.FeatureAction; } });
function default_1(config) {
    return new viessmann_api_client_1.Client(config, new oauth_client_1.OAuthClient(config.auth));
}
exports.default = default_1;
//# sourceMappingURL=index.js.map