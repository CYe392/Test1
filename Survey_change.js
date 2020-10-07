SurveyServiceNew.prototype.GetQuestionResponsesNew = function (onDataRetrieved, onError) {
                var _this = this;
                if (this.surveyId) {
                    var handlers = new Survey.RequestHandlers(onDataRetrieved, onError);
                    var onSuccess = function (serverResult) {
                        var questions = _this.ConvertFetchXmlResultToODataResult(serverResult);
                        return _this.onQuestionRetrievedNew(questions, handlers)
                    };
                    //IRIS-1725 OData can only pull no more than 50 records in expansition. Switch to FetchXML
                    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                        "<entity name='fi_question'>" +
                        "<attribute name='fi_answertype' />" +
                        "<attribute name='fi_description' />" +
                        "<attribute name='fi_hasseparator' />" +
                        "<attribute name='fi_ordernumber' />" +
                        "<attribute name='fi_questionid' />" +
                        "<attribute name='fi_questiontext' />" +
                        "<link-entity name='fi_question_fi_answeroption' from='fi_questionid' to='fi_questionid' link-type='outer' alias='qa'>" +
                        "<link-entity name='fi_answeroption' from='fi_answeroptionid' to='fi_answeroptionid' link-type='outer' alias='a'>" +
                        "<attribute name='fi_answer' />" +
                        "<attribute name='fi_answeroptionid' />" +
                        "<attribute name='fi_istextresponserequired' />" +
                        "<attribute name='fi_ordernumber' />" +
                        "<attribute name='fi_textresponsetype' />" +
                        "</link-entity>" +
                        "<order attribute='fi_ordernumber' descending='false' />" +
                        "</link-entity>" +
                        "<order attribute='fi_ordernumber' descending='false' />" +
                        "<filter type='and'>" +
                        "<condition attribute='statecode' operator='eq' value='0' />" +
                        "<condition attribute='fi_surveyid' operator='eq' value='" + this.surveyId + "' />" +
                        "</filter>" +
                        "</entity>" +
                        "</fetch>";
                    CrmFetchKit.Fetch(fetchXml, true).then(function (rawResult) {
                        if (rawResult && rawResult.records && rawResult.records.length) {
                            onSuccess(rawResult.records);
                        }
                    },
                        function (xhr, status, errorThrown) {
                            var msg = $(xhr.responseText).find('Message').text();
                            onError("Error fetching questions: " + msg);
                        });
                }
            };
            SurveyServiceNew.prototype.ConvertFetchXmlResultToODataResult = function (serverResult) {
                var questionGroups = serverResult.reduce(function (q, x) {
                    (q[x.Id] = x[x.Id] || []).push(x);
                    return q;
                }, {});
                var results = new Array();
                _.map(questionGroups, function (questionGroup) {
                    // var question = {
                    //     fi_answertype = { Value = queryGroup[0].attributes.fi_answertype && queryGroup[0].attributes.fi_answertype.value },
                    //     fi_description = queryGroup[0].attributes.fi_description && queryGroup[0].attributes.fi_description.value,
                    //     fi_hasseparator = queryGroup[0].attributes.fi_hasseparator && queryGroup[0].attributes.fi_hasseparator.value,
                    //     fi_ordernumber = queryGroup[0].attributes.fi_ordernumber && queryGroup[0].attributes.fi_ordernumber.value,
                    //     fi_questionId = queryGroup[0].Id,
                    //     fi_questiontext = queryGroup[0].attributes.fi_questiontext && queryGroup[0].attributes.fi_questiontext.value,
                    //     fi_question_fi_answeroption = { results = new Array() }
                    // };
                    // for (var i = 0; i < queryGroup.length; i++) {
                    //     question.fi_question_fi_answeroption.results.push({
                    //         fi_answer = queryGroup[i].attributes["a.fi_answer"] && queryGroup[i].attributes["a.fi_answer"].value,
                    //         fi_answeroptionId = queryGroup[i].attributes["a.fi_answeroptionid"] && queryGroup[i].attributes["a.fi_answeroptionid"].value,
                    //         fi_istextresponserequired = queryGroup[i].attributes["a.fi_istextresponserequired"] && queryGroup[i].attributes["a.fi_istextresponserequired"].value,
                    //         fi_ordernumber = queryGroup[i].attributes["a.fi_ordernumber"] && queryGroup[i].attributes["a.fi_ordernumber"].value,
                    //         fi_textresponsetype = { Value=queryGroup[i].attributes["a.fi_afi_textresponsetypenswer"] && queryGroup[i].attributes["a.fi_textresponsetype"].value }
                    //     });
                    // }
                    FisherJS.Survey.Utils.Query.getAttribute(questionGroup[0], "fi_answertype");
                    var question = {
                        fi_answertype = { Value = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[0], "fi_answertype") },
                        fi_description = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[0], "fi_description"),
                        fi_hasseparator = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[0], "fi_hasseparator"),
                        fi_ordernumber = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[0], "fi_ordernumber"),
                        fi_questionId = queryGroup[0].Id,
                        fi_questiontext = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[0], "fi_questiontext"),
                        fi_question_fi_answeroption = { results = new Array() }
                    };
                    for (var i = 0; i < queryGroup.length; i++) {
                        question.fi_question_fi_answeroption.results.push({
                            fi_answer = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[i], "a.fi_answer"),
                            fi_answeroptionId = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[i], "a.fi_answeroptionid"),
                            fi_istextresponserequired = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[i], "a.fi_istextresponserequired"),
                            fi_ordernumber = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[i], "a.fi_ordernumber"),
                            fi_textresponsetype = { Value = FisherJS.Survey.Utils.Query.getAttribute(questionGroup[i], "a.fi_afi_textresponsetypenswer")}
                        });
                    }
                    results.push(question);
                });
                return results;
            };
            
            FisherJS.Survey.Utils.Query = {
    getAttribute: function(obj, attribute){
        return obj && obj.attributes && obj.attributes[attribute] && obj.attributes[attribute].value;
    }
}
