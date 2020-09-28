var Fi;
(function (Fi) {
    (function (Utils) {
        var InputValidation = (function () {
            function InputValidation() {
            }
            InputValidation.IsNumeric = function (value) {
                return /^-?\d+$/.test(value) || /^-?\d+\.\d+$/.test(value);
            };

            InputValidation.EnforceTextLimit = //the maxlenght propertry textarea is not supported in ie8/9 (html5 property)
            function (e) {
                var answer = e.data;
                var newAnswer = e.target;
                var maxlength = parseInt(e.target.getAttribute('maxlength'));
                if (this.isAnswerLongerThanLimit(newAnswer.outerText, maxlength)) {
                    var trimedAnswer = newAnswer.outerText.slice(0, maxlength);
                    ((answer)).set("ResponseText", trimedAnswer);
                    newAnswer.innerText = trimedAnswer;
                }
            };

            InputValidation.isCtrlActionPaste = function (e) {
                return (e.ctrlKey != true) || (e.type == "paste");
            };

            InputValidation.isAnswerLongerThanLimit = function (answer, limit) {
                return answer.length >= limit;
            };

            InputValidation.hasValue = function (value) {
                return !(value === undefined || value === null || value.length === 0);
            };
            InputValidation.isValidNumericAnswer = function (value) {
                return $.isNumeric(value) && value.indexOf(",") < 0 && value.indexOf(".") < 0;
            };

            InputValidation.isAccountAnswerWithText = function (value) {
                //text: numeric
                var response = false;
                if (value.toString().indexOf(":") >= 0) {
                    var splitValue = value.split(":");
                    response = splitValue.length > 1 && $.isNumeric(splitValue[1]);
                }
                return response;
            };

            return InputValidation;
        })();
        Utils.InputValidation = InputValidation;

        var UserMessage = (function () {
            function UserMessage(messageText, isVisible) {
                this.Text = messageText;
                this.IsVisible = isVisible;
            }
            UserMessage.CreateNew = function (text, style) {
                var message = new UserMessage(text, true);
                message.MessageStyle = style;
                return message;
            };

            UserMessage.Error = function (text) {
                return UserMessage.CreateNew(text, "errorMessage");
            };
            UserMessage.Warning = function (text) {
                return UserMessage.CreateNew(text, "warningMessage");
            };
            UserMessage.Info = function (text) {
                return UserMessage.CreateNew(text, "successMessage");
            };
            return UserMessage;
        })();
        Utils.UserMessage = UserMessage;

        var UtilsSurvey = (function () {
            function UtilsSurvey() {                
            }
            UtilsSurvey.DisableLookup = function (lookupFieldName) {
                var lookupParentNode = document.getElementById(lookupFieldName + "_d");
                var lookupSpanNodes = lookupParentNode.getElementsByTagName("SPAN");

                for (var spanIndex = 0; spanIndex < lookupSpanNodes.length; spanIndex++) {
                    var currentSpan = lookupSpanNodes[spanIndex];

                    // Hide the hyperlink formatting
                    currentSpan.style.textDecoration = "none";
                    currentSpan.style.color = "#000000";

                    // Revoke click functionality
                    currentSpan.onclick = function () { };
                }               
            };

            return UtilsSurvey;
        })();
        Utils.UtilsSurvey = UtilsSurvey;
    })(Fi.Utils || (Fi.Utils = {}));
    var Utils = Fi.Utils;
})(Fi || (Fi = {}));

if (typeof (FisherJS) == "undefined") {
    FisherJS = { __namespace: true };
}

if (typeof (FisherJS.Survey) == "undefined") {
    FisherJS.Survey = {};
}

if (typeof (FisherJS.Survey.Utils) == "undefined") {
    FisherJS.Survey.Utils = {};
}

FisherJS.Survey.Utils.Presenter = {
    showHideLoading: function (value) {
        var loadingPanel = $("#loadingPanel");
        if (loadingPanel && loadingPanel.length > 0) {
            this.setLoadingPosition(loadingPanel);
            if (value) {
                loadingPanel.show();
            } else {
                loadingPanel.hide();
            }
        }
    },
    setLoadingPosition: function (loadingPanel) {
        loadingPanel[0].style.height = loadingPanel[0].parentElement.offsetHeight;
        loadingPanel[0].style.width = loadingPanel[0].parentElement.offsetWidth;
        loadingPanel[0].style.left = loadingPanel[0].parentElement.offsetLeft;
    }
}
