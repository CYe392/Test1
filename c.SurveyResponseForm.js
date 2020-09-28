/// <reference path="../../../Fisher.Crm.Survey/Fisher.Crm.Survey/../../WebResources/JS/Survey/Utils.js" />

var FormType;
(function (FormType) {
    FormType[FormType["Create"] = 1] = "Create";
    FormType[FormType["Update"] = 2] = "Update";
    FormType[FormType["ReadOnly"] = 3] = "ReadOnly";
    FormType[FormType["Disabled"] = 4] = "Disabled";
    FormType[FormType["QuickCreate"] = 5] = "QuickCreate";
    FormType[FormType["BulkEdit"] = 6] = "BulkEdit";
})(FormType || (FormType = {}));
var SaveMode;
(function (SaveMode) {
    SaveMode[SaveMode["Save"] = 1] = "Save";
    SaveMode[SaveMode["SaveAndClose"] = 2] = "SaveAndClose";
    SaveMode[SaveMode["SaveAndNew"] = 59] = "SaveAndNew";
    SaveMode[SaveMode["Deactivate"] = 5] = "Deactivate";
    SaveMode[SaveMode["Reactivate"] = 6] = "Reactivate";
    SaveMode[SaveMode["Assign"] = 47] = "Assign";
})(SaveMode || (SaveMode = {}));

var Fi;
(function (Fi) {
    (function (Forms) {
        var SurveyResponse = (function () {
            function SurveyResponse() {
                this._isSaving = false;
            }

            function bindResizeEvent() {
                $(window).bind('resize', windowResize);
            };

            function windowResize() {
                var heightWindow = $(window).height(),
                       heightHeader = document.getElementById("formHeaderContainer").clientHeight,
                       heightFooter = document.getElementById("formFootersContainer").clientHeight,

                       iframe = document.getElementById("WebResource_SurveyResponse"),
                       $iframe = $(iframe),
                       iframeContent = document.getElementById("WebResource_SurveyResponse_d"),
                       $iframeContent = $(iframeContent),

                       tdAreas = document.getElementById("tdAreas"),
                       $tdAreas = $(tdAreas),
                       height = heightWindow - heightHeader - heightFooter,

                       newIFrameHeight = height - 160 < 330 ? 330 : height - 160,

                       newtdAreasHeight = height;

                $iframe.height(newIFrameHeight);
                $iframeContent.height(newIFrameHeight);

                $tdAreas.height(newtdAreasHeight);
            }

            SurveyResponse.OnLoad = //called on the SurveyResponse form at the load event
            function () {
                SurveyResponse.instance = new SurveyResponse();
                var contact = Xrm.Page.getAttribute(SurveyResponse.ContactAttributeName).getValue();
                var survey = Xrm.Page.getAttribute(SurveyResponse.SurveyAttributeName).getValue();

                var isFirstLoad = survey == null;
                var isContactEmpty = contact == null;

                SurveyResponse.instance.Load(isFirstLoad, isContactEmpty);
                if (Fi && Fi.Utils && Fi.Utils.UtilsSurvey) {
                    Fi.Utils.UtilsSurvey.DisableLookup(SurveyResponse.SurveyAttributeName);
                }
                bindResizeEvent();
                windowResize();
            };

            SurveyResponse.OnSave = //called on the SurveyResponse form at the save event
            function (executionContext) {
                // prevent save execution
                executionContext.getEventArgs().preventDefault();
                return false;
            };

            SurveyResponse.CustomSave = function (executionContext) {
                SurveyResponse.instance.Save(executionContext);
            };

            SurveyResponse.OnSurveyChanged = //called on the SurveyResponse form at the survey changed event
            function () {
                SurveyResponse.instance.SetNameOnCreate();
                if (Fi && Fi.Utils && Fi.Utils.UtilsSurvey) {
                    Fi.Utils.UtilsSurvey.DisableLookup(SurveyResponse.SurveyAttributeName);
                }
            };

            SurveyResponse.OnContactChanged = //called on the SurveyResponse form at the contact changed event
            function () {
                SurveyResponse.instance.SetNameOnCreate();
            };
            SurveyResponse.prototype.SetNameOnCreate = function () {
                if (this._isCreate) {
                    var survey = Xrm.Page.getAttribute(SurveyResponse.SurveyAttributeName).getValue();
                    var contact = Xrm.Page.getAttribute(SurveyResponse.ContactAttributeName).getValue();
                    var surveyResponseName = "";
                    if (survey && contact) {
                        surveyResponseName = survey[0].name + " for " + contact[0].name;
                    }
                    Xrm.Page.getAttribute("fi_name").setValue(surveyResponseName);
                    SurveyResponse.instance.LoadNew(false, true);
                }
            };

            SurveyResponse.prototype.Load = function (isFirstLoad, isContactEmpty) {
                var formType = Xrm.Page.ui.getFormType();
                this._isCreate = (formType == FormType.Create || formType == FormType.QuickCreate);
                this._isDisabled = (formType == FormType.Disabled);
                if (!this._isCreate) {
                    Xrm.Page.getControl(SurveyResponse.SurveyAttributeName).setDisabled(true);
                }
                if (!isContactEmpty) {
                    Xrm.Page.getControl(SurveyResponse.ContactAttributeName).setDisabled(true);
                }
                Xrm.Page.getControl(SurveyResponse.SurveyNameAttributeName).setDisabled(true);

                this.LoadNew(isFirstLoad, this._isCreate);
            };
            SurveyResponse.prototype.LoadNew = function (isFirstLoad, isCreate) {
                this.LoadSurveyResponseNew(isFirstLoad, isCreate);
            };
            SurveyResponse.prototype.LoadSurveyResponseNew = function (isFirstLoad, isCreate) {
                var iframeSurveyModule = this.GetSurveyModuleFromIframe();
                var _this = this;
                if (iframeSurveyModule) {
                    this.CallLoadOnControllerNew(iframeSurveyModule, isFirstLoad, isCreate);
                } else {
                    setTimeout(function () {
                        _this.LoadSurveyResponseNew(isFirstLoad, isCreate);
                    }, 50);
                }
            };
            SurveyResponse.prototype.GetSurveyModuleFromIframe = function () {
                var myFrame = document.getElementById("WebResource_SurveyResponse");
                if (!myFrame) {
                    return null;
                    //throw new Error();
                }
                var fi = (myFrame).contentWindow.Fi;
                if (fi && fi.Survey) {
                    return fi.Survey;
                }
                return null;
            };

            //#region NEW
            SurveyResponse.prototype.CallLoadOnControllerNew = function (surveyModule, isFirstLoad, isCreate) {
                this._controllerNew = this.GetControllerNew(surveyModule);
                this._controllerNew.BindViewModelAndLoadDataNew(isFirstLoad, isCreate);
            };
            SurveyResponse.prototype.GetControllerNew = function (surveyModule) {
                var surveyId = null;
                var surveyResponseId = null;
                var contactId = null;
                var surveyName = "";
                var organizationUrl = Xrm.Page.context.getClientUrl();
                var userId = Xrm.Page.context.getUserId();

                if (Xrm.Page.getAttribute(SurveyResponse.SurveyAttributeName).getValue() && Xrm.Page.getAttribute(SurveyResponse.SurveyAttributeName).getValue().length > 0) {
                    surveyId = Xrm.Page.getAttribute(SurveyResponse.SurveyAttributeName).getValue()[0].id;
                }
                if (Xrm.Page.getAttribute(SurveyResponse.ContactAttributeName).getValue() && Xrm.Page.getAttribute(SurveyResponse.ContactAttributeName).getValue().length > 0) {
                    contactId = Xrm.Page.getAttribute(SurveyResponse.ContactAttributeName).getValue()[0].id;
                }
                if (Xrm.Page.getAttribute(SurveyResponse.SurveyNameAttributeName).getValue()) {
                    surveyName = Xrm.Page.getAttribute(SurveyResponse.SurveyNameAttributeName).getValue();
                }
                if (!this._isCreate) {
                    surveyId = Xrm.Page.getAttribute(SurveyResponse.SurveyAttributeName).getValue()[0].id;
                    surveyResponseId = Xrm.Page.data.entity.getId();
                }
                return new surveyModule.SurveyResponseControllerNew(surveyId, surveyResponseId, organizationUrl, userId, this._isDisabled, contactId, surveyName);
            };

            SurveyResponse.prototype.Save = function (executionContext) {
                var _this = this;

                if (this._controllerNew) {
                    if (!this._isCreate) {
                        // save only question responses
                        this.saveQuestionResponses(executionContext);
                    } else {
                        if (!this._isSaving) {
                            this._isSaving = true;
                            // do not submit field for create
                            Xrm.Page.data.entity.attributes.forEach(function (item) {
                                Xrm.Page.getAttribute(item.getName()).setSubmitMode("never");
                            });

                            // define callback
                            var onCompletion = function (wasSuccesful) {
                                this._isSaving = false;
                                if (wasSuccesful) {
                                    Xrm.Page.ui.close();
                                    try {
                                        window.parent.opener.document.getElementById("crmGrid_fi_contact_fi_surveyresponse_contactid").control.refresh();
                                    }
                                    catch (e) { }
                                }
                            };
                            // save survey response first
                            this._controllerNew.SaveSurveyResponse(onCompletion);
                        }
                    }
                }
            };
            
            SurveyResponse.prototype.saveQuestionResponses = function (executionContext) {
                var _this = this;
                if (!this._isSaving) {
                    this._isSaving = true;
                    var saveMode = executionContext.getEventArgs().getSaveMode();
                    var shouldWaitForCompletion = (saveMode == SaveMode.SaveAndClose);
                    var onCompletion;
                    if (shouldWaitForCompletion) {
                        onCompletion = function (wasSuccesful) {
                            if (wasSuccesful) {
                                Xrm.Page.ui.close();
                                //we close the page, so SurveyResponse._isSaving = false; would be useless (not called)
                            }
                        };
                        Xrm.Page.data.entity.save();
                    } else {
                        onCompletion = function (wasSuccesful) {
                            _this._isSaving = false;
                        };
                    }
                    this._controllerNew.SaveQuestionResponses(onCompletion);
                }
            };

            SurveyResponse.SurveyAttributeName = "fi_surveyid";
            SurveyResponse.ContactAttributeName = "fi_contactid";
            SurveyResponse.SurveyNameAttributeName = "fi_name";
            return SurveyResponse;
        })();
        Forms.SurveyResponse = SurveyResponse;
    })(Fi.Forms || (Fi.Forms = {}));
    var Forms = Fi.Forms;
})(Fi || (Fi = {}));
