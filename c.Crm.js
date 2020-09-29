var Fi;
(function (Fi) {
    (function (Crm) {
        var Request = (function () {
            function Request(entityName, onSuccess, onError) {
                var _this = this;
                if (!entityName)
                    throw new Error("entityName is null or undefined.");
                if (!onSuccess)
                    throw new Error("onSuccess is null or undefined.");
                if (!onError)
                    throw new Error("onError is null or undefined.");

                this.EntityName = entityName;
                this.OnSuccess = function (data, status, request) {
                    onSuccess(data);
                };

                this.OnError = function (request, status, error) {
                    var failureReason = _this.GetError(request);
                    if (!failureReason) {
                        failureReason = new Error("Unexpected error." + request.responseText);
                    }
                    onError(failureReason);
                };
            }
            Request.prototype.GetError = function (request) {
                var failureReason;
                try {
                    var parsedResponse = JSON.parse(request.responseText);
                    var message = parsedResponse.error.message.value;
                    failureReason = new Error(message);
                } catch (ex) {
                    failureReason = null;
                }
                return failureReason;
            };
            return Request;
        })();
        Crm.Request = Request;
        var KeyValuePair = (function () {
            function KeyValuePair(key, value) {
                this.Key = key;
                this.Value = value;
            }
            return KeyValuePair;
        })();
        var Service = (function () {
            function Service(organizationUrl) {
                this.organizationUrl = organizationUrl;
                this.endpointUrl = organizationUrl + Service.OrganizationDataEndpoint;
            }
            Service.prototype.Retrieve = function (request, recordId, queryString) {
                var recordIdentifier = RequestHelper.GetRecordIdentifier(request.EntityName, recordId);
                var pathPartAndQuery = RequestHelper.GetWithQuery(recordIdentifier, queryString);
                var callSettings = this.GetCallSettings(request, pathPartAndQuery, Service.JsonHeaders, Service.RequestMethodGet);
                this.Call(callSettings);
            };
            Service.prototype.RetrieveMultiple = function (request, queryString) {
                var _this = this;
                var callSettings;

                var results = new Array();
                var getAllRecords = function (data, status, ajaxRequest) {
                    if (data && data.d && data.d.results) {
                        results = results.concat(data.d.results);
                        if (data.d.__next == null) {
                            request.OnSuccess(results, status, ajaxRequest);
                        } else {
                            callSettings.url = data.d.__next;
                            _this.Call(callSettings);
                        }
                    } else {
                        request.OnError(ajaxRequest, status, data);
                    }
                };

                var pathPartAndQuery = RequestHelper.GetWithQuery(RequestHelper.GetEntitySetIdentifier(request.EntityName), queryString);
                callSettings = this.GetAjaxSettings(pathPartAndQuery, Service.JsonHeaders, Service.RequestMethodGet, getAllRecords, request.OnError);

                this.Call(callSettings);
            };
            Service.prototype.AssociateRecords = function (request, parentId, relationshipName, childId, childType) {
                var relationUrlPart = RequestHelper.GetRecordIdentifier(request.EntityName, parentId) + "/$links/" + relationshipName;
                var callSettings = this.GetCallSettings(request, relationUrlPart, Service.JsonHeaders, Service.RequestMethodPost);
                var requestBody = { uri: this.endpointUrl + RequestHelper.GetRecordIdentifier(childType, childId) };
                callSettings.data = JSON.stringify(requestBody);

                this.Call(callSettings);
            };
            Service.prototype.CreateRecord = function (request, record) {
                var entitySet = RequestHelper.GetEntitySetIdentifier(request.EntityName);
                var callSettings = this.GetCallSettings(request, entitySet, Service.JsonHeaders, Service.RequestMethodPost);
                callSettings.data = JSON.stringify(record);

                this.Call(callSettings);
            };
            Service.prototype.UpdateRecord = function (request, recordId, record) {
                var recordIdentifier = RequestHelper.GetRecordIdentifier(request.EntityName, recordId);
                var callSettings = this.GetCallSettings(request, recordIdentifier, Service.UpdateHeaders, Service.RequestMethodPost);
                callSettings.data = JSON.stringify(record);

                this.Call(callSettings);
            };
            Service.prototype.DisassociateRecords = function (request, parentId, relationshipName, childId) {
                var relationUrlPart = RequestHelper.GetRecordIdentifier(request.EntityName, parentId) + "/$links/" + relationshipName + "(" + RequestHelper.GuidToString(childId) + ")";
                var callSettings = this.GetCallSettings(request, relationUrlPart, Service.DeleteHeaders, Service.RequestMethodPost);

                $.ajax(callSettings);
            };
            Service.prototype.DeleteRecord = function (request, recordId) {
                var recordIdentifier = RequestHelper.GetRecordIdentifier(request.EntityName, recordId);
                var callSettings = this.GetCallSettings(request, recordIdentifier, Service.DeleteHeaders, Service.RequestMethodPost);

                $.ajax(callSettings);
            };
            Service.prototype.DeactivateRecord = function (recordId, entityName, status, state, onSuccess, onError) {
                sendDeactivationRequest(this.organizationUrl, recordId, entityName, status, state, onSuccess, onError);
            };

            Service.prototype.GetAjaxSettings = function (resourceUrlPart, headers, type, success, error) {
                var url = this.endpointUrl + resourceUrlPart;
                var beforeSend = function (request) {
                    for (var i = 0; i < headers.length; i++) {
                        request.setRequestHeader(headers[i].Key, headers[i].Value);
                    }
                };

                var requestSettings = {
                    url: url,
                    success: success,
                    error: error,
                    beforeSend: beforeSend,
                    type: type,
                    contentType: "application/json; charset=utf-8",
                    datatype: "json",
                    async: true
                };
                return requestSettings;
            };
            Service.prototype.GetCallSettings = function (request, resourceUrlPart, headers, type) {
                return this.GetAjaxSettings(resourceUrlPart, headers, type, request.OnSuccess, request.OnError);
            };
            Service.prototype.Call = function (settings) {
                $.ajax(settings);
            };
            Service.OrganizationDataEndpoint = "/XrmServices/2011/OrganizationData.svc/";

            Service.AcceptJsonHeader = new KeyValuePair("Accept", "application/json");
            Service.JsonHeaders = [Service.AcceptJsonHeader];
            Service.UpdateHeaders = [Service.AcceptJsonHeader, new KeyValuePair("X-HTTP-Method", "MERGE")];
            Service.DeleteHeaders = [Service.AcceptJsonHeader, new KeyValuePair("X-HTTP-Method", "DELETE")];

            Service.RequestMethodPost = "POST";
            Service.RequestMethodGet = "GET";

            function sendDeactivationRequest(url, recordId, entityName, status, state, onSuccess, onError) {
                var requestMain = [
        "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">",
        "  <s:Body>",
        "    <Execute xmlns=\"http://schemas.microsoft.com/xrm/2011/Contracts/Services\" xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\">",
        "      <request i:type=\"b:SetStateRequest\" xmlns:a=\"http://schemas.microsoft.com/xrm/2011/Contracts\" xmlns:b=\"http://schemas.microsoft.com/crm/2011/Contracts\">",
        "        <a:Parameters xmlns:c=\"http://schemas.datacontract.org/2004/07/System.Collections.Generic\">",
        "          <a:KeyValuePairOfstringanyType>",
        "            <c:key>EntityMoniker</c:key>",
        "            <c:value i:type=\"a:EntityReference\">",
        "              <a:Id>" + recordId + "</a:Id>",
        "              <a:LogicalName>" + entityName + "</a:LogicalName>",
        "              <a:Name i:nil=\"true\" />",
        "            </c:value>",
        "          </a:KeyValuePairOfstringanyType>",
        "          <a:KeyValuePairOfstringanyType>",
        "            <c:key>State</c:key>",
        "            <c:value i:type=\"a:OptionSetValue\">",
        "              <a:Value>" + state + "</a:Value>",
        "            </c:value>",
        "          </a:KeyValuePairOfstringanyType>",
        "          <a:KeyValuePairOfstringanyType>",
        "            <c:key>Status</c:key>",
        "            <c:value i:type=\"a:OptionSetValue\">",
        "              <a:Value>" + status + "</a:Value>",
        "            </c:value>",
        "          </a:KeyValuePairOfstringanyType>",
        "        </a:Parameters>",
        "        <a:RequestId i:nil=\"true\" />",
        "        <a:RequestName>SetState</a:RequestName>",
        "      </request>",
        "    </Execute>",
        "  </s:Body>",
        "</s:Envelope>"
                ].join("");

                var req = new XMLHttpRequest();

                req.open("POST", url + "/XRMServices/2011/Organization.svc/web", true)

                // Responses will return XML. It isn't possible to return JSON.
                req.setRequestHeader("Accept", "application/xml, text/xml, */*");
                req.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                req.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute");

                req.onreadystatechange = function () {
                    handleDeactivationResponse(req, onSuccess, onError);
                };

                req.send(requestMain);
            }

            function handleDeactivationResponse(req, successCallback, errorCallback) {
                ///<summary>
                /// Recieves the assign response
                ///</summary>
                ///<param name="req" Type="XMLHttpRequest">
                /// The XMLHttpRequest response
                ///</param>
                ///<param name="successCallback" Type="Function">
                /// The function to perform when an successfult response is returned.
                /// For this message no data is returned so a success callback is not really necessary.
                ///</param>
                ///<param name="errorCallback" Type="Function">
                /// The function to perform when an error is returned.
                /// This function accepts a JScript error returned by the _getError function
                ///</param>

                if (req.readyState == 4) {
                    if (req.status == 200) {
                        if (successCallback != null)
                        { successCallback(); }
                    }
                    else {
                        errorCallback(_getError(req.responseXML));
                    }
                }
            }

            function _getError(faultXml) {
                ///<summary>
                /// Parses the WCF fault returned in the event of an error.
                ///</summary>
                ///<param name="faultXml" Type="XML">
                /// The responseXML property of the XMLHttpRequest response.
                ///</param>
                var errorMessage = "";

                if (typeof faultXml == "object") {
                    try {
                        var bodyNode = faultXml.firstChild.firstChild;
                        //Retrieve the fault node
                        for (var i = 0; i < bodyNode.childNodes.length; i++) {
                            var node = bodyNode.childNodes[i];
                            //NOTE: This comparison does not handle the case where the XML namespace changes
                            if ("s:Fault" == node.nodeName) {
                                for (var j = 0; j < node.childNodes.length; j++) {
                                    var faultStringNode = node.childNodes[j];
                                    if ("faultstring" == faultStringNode.nodeName) {
                                        errorMessage = faultStringNode.text;
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                    catch (e) { };
                }

                return errorMessage != "" ? new Error(errorMessage) : undefined;
            }

            return Service;
        })();
        Crm.Service = Service;
        var RequestHelper = (function () {
            function RequestHelper() {
            }
            RequestHelper.GetWithQuery = function (queriedResource, query) {
                var result = queriedResource;
                if (query != null) {
                    if (query.charAt(0) != "?") {
                        result = result + "?";
                    }
                    result = result + query;
                }
                return result;
            };
            RequestHelper.GetRecordIdentifier = function (entityName, recordId) {
                var recordIdentifier = entityName + "Set" + "(" + RequestHelper.GuidToString(recordId) + ")";
                return recordIdentifier;
            };
            RequestHelper.GetEntitySetIdentifier = function (entityName) {
                return entityName + "Set";
            };
            RequestHelper.GuidToString = function (recordId) {
                if (!recordId) {
                    throw new Error("recordId is not valid");
                }
                var id = recordId;
                if (id.charAt(0) == "{" && id.charAt(id.length - 1) == "}") {
                    id = id.substring(1, id.length - 1);
                }
                return "guid'" + id + "'";
            };
            return RequestHelper;
        })();
        Crm.RequestHelper = RequestHelper;
    })(Fi.Crm || (Fi.Crm = {}));
    var Crm = Fi.Crm;
})(Fi || (Fi = {}));
