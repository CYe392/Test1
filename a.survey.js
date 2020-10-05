var Async;
(function(Async)
{
    var OperationCompletedHandler = (function()
        {
            function OperationCompletedHandler(onSuccess, onError)
            {
                if (typeof onSuccess === "undefined")
                {
                    onSuccess = null
                }
                if (typeof onError === "undefined")
                {
                    onError = null
                }
                this.onSuccess = onSuccess;
                this.onError = onError
            }
            return OperationCompletedHandler
        })();
    Async.OperationCompletedHandler = OperationCompletedHandler;
    var Task = (function()
        {
            function Task(handlers)
            {
                this.handler = handlers
            }
            Task.New = function(onSuccess, onError)
            {
                if (typeof onSuccess === "undefined")
                {
                    onSuccess = null
                }
                if (typeof onError === "undefined")
                {
                    onError = null
                }
                return new Task(new OperationCompletedHandler(onSuccess, onError))
            };
            return Task
        })();
    Async.Task = Task;
    var TasksExecutor = (function()
        {
            function TasksExecutor(handlers)
            {
                this.groupHandler = handlers;
                this.operations = new Array
            }
            TasksExecutor.prototype.Add = function(t)
            {
                if (!t.handler.onError)
                {
                    t.handler.onError = this.groupHandler.onError
                }
                this.operations.push(t)
            };
            TasksExecutor.prototype.Execute = function()
            {
                var _this = this;
                var operationsCount = this.operations.length;
                if (operationsCount > 0)
                {
                    _.each(this.operations, function(t)
                    {
                        var onTaskSuccess = function()
                            {
                                if (t.handler.onSuccess)
                                {
                                    t.handler.onSuccess()
                                }
                                operationsCount--;
                                if (operationsCount === 0)
                                {
                                    _this.groupHandler.onSuccess()
                                }
                            };
                        t.operation(new OperationCompletedHandler(onTaskSuccess, t.handler.onError))
                    })
                }
                else
                {
                    this.groupHandler.onSuccess()
                }
            };
            return TasksExecutor
        })();
    Async.TasksExecutor = TasksExecutor
})(Async || (Async = {}));
var Fi;
(function(Fi)
{
    (function(Survey)
    {
        (function(AnswerType)
        {
            AnswerType[AnswerType["Text"] = 157610000] = "Text";
            AnswerType[AnswerType["TwoOptions"] = 157610001] = "TwoOptions";
            AnswerType[AnswerType["SingleSelection"] = 157610002] = "SingleSelection";
            AnswerType[AnswerType["MultipleSelection"] = 157610003] = "MultipleSelection";
            AnswerType[AnswerType["Numeric"] = 157610004] = "Numeric";
            AnswerType[AnswerType["Date"] = 157610005] = "Date";
            AnswerType[AnswerType["MultilineText"] = 157610006] = "MultilineText";
            AnswerType[AnswerType["Information"] = 157610007] = "Information"
        })(Survey.AnswerType || (Survey.AnswerType = {}));
        var AnswerType = Survey.AnswerType;
        (function(TextResponseType)
        {
            TextResponseType[TextResponseType["Numeric"] = 157610001] = "Numeric";
            TextResponseType[TextResponseType["Text"] = 157610000] = "Text"
        })(Survey.TextResponseType || (Survey.TextResponseType = {}));
        var TextResponseType = Survey.TextResponseType;
        var AnswerOption = (function()
            {
                function AnswerOption(id, answer, isTextRequired, orderNumber, textResponseType)
                {
                    this.Id = id;
                    this.Answer = answer;
                    this.IsTextResponseRequired = isTextRequired;
                    this.OrderNumber = orderNumber;
                    this.TextResponseType = textResponseType
                }
                AnswerOption.prototype.IsTextResponseNumeric = function()
                {
                    return this.IsTextResponseRequired && (this.TextResponseType).Value === TextResponseType.Numeric
                };
                AnswerOption.EntityName = "fi_answeroption";
                AnswerOption.Empty = new AnswerOption("", "", false, 0, null);
                return AnswerOption
            })();
        Survey.AnswerOption = AnswerOption;
        var AnswerOptionResponse = (function()
            {
                function AnswerOptionResponse(questionResponseId, answerOption, id, additionalText, isSelected, entityUniqueId)
                {
                    if (typeof id === "undefined")
                    {
                        id = null
                    }
                    if (typeof additionalText === "undefined")
                    {
                        additionalText = ""
                    }
                    if (typeof isSelected === "undefined")
                    {
                        isSelected = false
                    }
                    if (typeof entityUniqueId === "undefined")
                    {
                        entityUniqueId = null
                    }
                    this.QuestionResponseId = questionResponseId;
                    this.AnswerOption = answerOption;
                    this.AdditionalText = additionalText;
                    this.IsSelected = isSelected;
                    this.Id = id;
                    this.EntityUniqueId = entityUniqueId;
                    this.IsInvalid = false;
                    this.IsTextResponseRequiredFlag = isSelected && answerOption.IsTextResponseRequired
                }
                AnswerOptionResponse.prototype.IsTextResponseRequired = function()
                {
                    return (this.IsSelected && this.AnswerOption.IsTextResponseRequired) || this.IsTextResponseRequiredFlag
                };
                AnswerOptionResponse.prototype.SetAnswerOption = function(value)
                {
                    if (value.Id != this.AnswerOption.Id)
                    {
                        throw new Error("Argument Exception: value.");
                    }
                    this.AnswerOption = value;
                    this.IsTextResponseRequiredFlag = this.IsSelected && value.IsTextResponseRequired
                };
                AnswerOptionResponse.prototype.IsFor = function(option)
                {
                    return this.AnswerOption.Id == option.Id
                };
                return AnswerOptionResponse
            })();
        Survey.AnswerOptionResponse = AnswerOptionResponse;
        var Question = (function()
            {
                function Question(id, question, answerType, position, description, isSeparator)
                {
                    this.Id = id;
                    this.AnswerType = answerType;
                    this.QuestionText = question;
                    this.OrderNumber = position;
                    this.Description = description ? description : "";
                    this.IsSeparator = isSeparator
                }
                Question.prototype.CanHaveAnswerOptions = function()
                {
                    return this.AnswerType === AnswerType.MultipleSelection || this.AnswerType === AnswerType.SingleSelection || this.AnswerType === AnswerType.TwoOptions
                };
                Question.prototype.SetAnswerOptions = function(answers)
                {
                    if (this.CanHaveAnswerOptions())
                    {
                        this.AnswersOptions = answers
                    }
                };
                Question.prototype.Continuity = function()
                {
                    var continuity;
                    if (this.IsSeparator)
                    {
                        continuity = Question.SeparatorQuestion
                    }
                    else
                    {
                        continuity = Question.ContinuousQuestion
                    }
                    return continuity
                };
                Question.prototype.IsAccountQuestion = function()
                {
                    var lowerText = this.QuestionText.toLowerCase();
                    return (lowerText.indexOf("account") >= 0 && lowerText.indexOf("select type & enter amount") >= 0)
                };
                Question.prototype.IsAccountTotalQuestion = function()
                {
                    var lowerText = this.QuestionText.toLowerCase();
                    return (lowerText.indexOf("total value of all accounts") >= 0)
                };
                Question.prototype.IsNetworkIdQuestion = function()
                {
                    var lowerText = this.QuestionText.toLowerCase();
                    return (lowerText.indexOf("network id") >= 0)
                };
                Question.prototype.IsContactIdQuestion = function()
                {
                    var lowerText = this.QuestionText.toLowerCase();
                    return (lowerText.indexOf("client contact id") >= 0)
                };
                Question.prototype.IsClientLastNameQuestion = function()
                {
                    var lowerText = this.QuestionText.toLowerCase();
                    return (lowerText.indexOf("client last name") >= 0)
                };
                Question.prototype.IsLastNameICQuestion = function()
                {
                    var lowerText = this.QuestionText.toLowerCase();
                    return (lowerText.indexOf("ic assigned") >= 0)
                };
                Question.EntityName = "fi_question";
                Question.SeparatorQuestion = "separator";
                Question.ContinuousQuestion = "continuous";
                return Question
            })();
        Survey.Question = Question;
        var QuestionResponse = (function()
            {
                function QuestionResponse(id, questionId)
                {
                    this.Id = id;
                    this.QuestionId = questionId
                }
                QuestionResponse.prototype.isFor = function(q)
                {
                    return this.QuestionId === q.Id
                };
                QuestionResponse.prototype.setQuestion = function(question)
                {
                    if (this.Question)
                        throw new Error("Invalid operation exception: question was already set.");
                    if (!this.isFor(question))
                        throw new Error("Invalid operation exception: the question is not for this question response.");
                    this.Question = question
                };
                return QuestionResponse
            })();
        Survey.QuestionResponse = QuestionResponse
    })(Fi.Survey || (Fi.Survey = {}));
    var Survey = Fi.Survey
})(Fi || (Fi = {}));
var __extends = this.__extends || function(d, b)
    {
        for (var p in b)
            if (b.hasOwnProperty(p))
                d[p] = b[p];
        function __()
        {
            this.constructor = d
        }
        __.prototype = b.prototype;
        d.prototype = new __
    };
var Fi;
(function(Fi)
{
    (function(Survey)
    {
        var RequestHandlers = (function()
            {
                function RequestHandlers(onSuccess, onError)
                {
                    if (!onSuccess)
                        throw new Error("onSuccess");
                    if (!onError)
                        throw new Error("onError");
                    this.onSuccess = onSuccess;
                    this.onError = onError
                }
                return RequestHandlers
            })();
        Survey.RequestHandlers = RequestHandlers;
        var AnswerOptionResponseEntity = (function(_super)
            {
                __extends(AnswerOptionResponseEntity, _super);
                function AnswerOptionResponseEntity(questionResponseId, answerOption, id, additionalText, isSelected)
                {
                    if (typeof id === "undefined")
                    {
                        id = null
                    }
                    if (typeof additionalText === "undefined")
                    {
                        additionalText = ""
                    }
                    if (typeof isSelected === "undefined")
                    {
                        isSelected = false
                    }
                    _super.call(this, questionResponseId, answerOption, id, additionalText, isSelected);
                    this.initialAdditionalText = additionalText
                }
                AnswerOptionResponseEntity.getFrom = function(questionResponseId, serverObject)
                {
                    var option = new Survey.AnswerOption(serverObject.fi_answeroptionid.Id, null, null, null, null);
                    var additionalText = serverObject.fi_additionaltext;
                    return new AnswerOptionResponseEntity(questionResponseId, option, serverObject.fi_answeroptionresponseId, serverObject.fi_additionaltext, true)
                };
                AnswerOptionResponseEntity.getFromEmptyQuestionResponse = function(serverObject)
                {
                    var option = new Survey.AnswerOption(serverObject.fi_answeroptionid, serverObject.fi_answer, null, null, null);
                    return new AnswerOptionResponseEntity(null, option, null, "", true)
                };
                AnswerOptionResponseEntity.prototype.isDirty = function()
                {
                    return this.AdditionalText !== this.initialAdditionalText
                };
                AnswerOptionResponseEntity.prototype.commit = function()
                {
                    if (this.isDirty())
                    {
                        this.initialAdditionalText = this.AdditionalText
                    }
                };
                AnswerOptionResponseEntity.prototype.save = function(handler, service)
                {
                    if (this.Id)
                    {
                        if (this.isDirty())
                        {
                            this.update(handler, service)
                        }
                        else
                        {
                            handler.onSuccess()
                        }
                    }
                    else
                    {
                        this.create(handler, service)
                    }
                };
                AnswerOptionResponseEntity.prototype.update = function(handler, service)
                {
                    var request = new Fi.Crm.Request(AnswerOptionResponseEntity.EntityName, handler.onSuccess, handler.onError);
                    var record = {
                            fi_additionaltext: this.AdditionalText, fi_answeroptionid: {
                                    Id: this.AnswerOption.Id, LogicalName: Survey.AnswerOption.EntityName, Name: ""
                                }
                        };
                    service.UpdateRecord(request, this.Id, record)
                };
                AnswerOptionResponseEntity.prototype.deactivateRecord = function(handler, service)
                {
                    var _this = this;
                    var onSuccess = function()
                        {
                            _this.Id = null;
                            _this.initialAdditionalText = null;
                            _this.AdditionalText = null;
                            handler.onSuccess()
                        };
                    service.DeactivateRecord(this.Id, AnswerOptionResponseEntity.EntityName, 2, 1, onSuccess, handler.onError)
                };
                AnswerOptionResponseEntity.prototype.activateRecord = function(handler, service)
                {
                    var request = new Fi.Crm.Request(AnswerOptionResponseEntity.EntityName, handler.onSuccess, handler.onError);
                    service.DeactivateRecord(this.Id, AnswerOptionResponseEntity.EntityName, 1, 0, handler.onSuccess, handler.onError)
                };
                AnswerOptionResponseEntity.prototype.create = function(handler, service)
                {
                    var _this = this;
                    var onSuccess = function(data)
                        {
                            var recordId = data.d.fi_answeroptionresponseId;
                            _this.Id = recordId;
                            handler.onSuccess()
                        };
                    var request = new Fi.Crm.Request(AnswerOptionResponseEntity.EntityName, onSuccess, handler.onError);
                    var serverObject = {
                            fi_additionaltext: this.AdditionalText, fi_answeroptionid: {
                                    Id: this.AnswerOption.Id, LogicalName: Survey.AnswerOption.EntityName, Name: ""
                                }, fi_questionresponseid: {
                                    Id: this.QuestionResponseId, LogicalName: QuestionResponseEntity.EntityName, Name: ""
                                }
                        };
                    service.CreateRecord(request, serverObject)
                };
                AnswerOptionResponseEntity.prototype.setParent = function(){};
                AnswerOptionResponseEntity.prototype.setChildrenUniqueIds = function(id){};
                AnswerOptionResponseEntity.prototype.setDefaultValue = function(value){};
                AnswerOptionResponseEntity.EntityName = "fi_answeroptionresponse";
                return AnswerOptionResponseEntity
            })(Survey.AnswerOptionResponse);
        Survey.AnswerOptionResponseEntity = AnswerOptionResponseEntity;
        var QuestionResponseEntity = (function(_super)
            {
                __extends(QuestionResponseEntity, _super);
                function QuestionResponseEntity(serverObject)
                {
                    _super.call(this, serverObject.fi_questionresponseId, serverObject.fi_questionid.Id)
                }
                QuestionResponseEntity.prototype.setParent = function(id)
                {
                    this.SurveyResponseId = id
                };
                QuestionResponseEntity.EntityName = "fi_questionresponse";
                return QuestionResponseEntity
            })(Survey.QuestionResponse);
        Survey.QuestionResponseEntity = QuestionResponseEntity;
        var InputQuestionResponse = (function(_super)
            {
                __extends(InputQuestionResponse, _super);
                function InputQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject)
                }
                InputQuestionResponse.prototype.setInitalValue = function(value)
                {
                    this.Value = value;
                    this.initialValue = value
                };
                InputQuestionResponse.prototype.setParent = function(id)
                {
                    _super.prototype.setParent.call(this, id)
                };
                InputQuestionResponse.prototype.save = function(handler, service)
                {
                    if (this.Id)
                    {
                        if (this.isDirty())
                        {
                            this.update(handler, service)
                        }
                        else
                        {
                            handler.onSuccess()
                        }
                    }
                    else
                    {
                        this.create(handler, service)
                    }
                };
                InputQuestionResponse.prototype.create = function(handler, service)
                {
                    var _this = this;
                    var onSuccess = function(data)
                        {
                            var recordId = data.d.fi_questionresponseId;
                            _this.Id = recordId;
                            handler.onSuccess()
                        };
                    var request = new Fi.Crm.Request(QuestionResponseEntity.EntityName, onSuccess, handler.onError);
                    var responseText = this.Value ? this.Value.toString() : null;
                    ;
                    var serverObject = {
                            fi_questionid: {
                                Id: this.QuestionId, LogicalName: Survey.Question.EntityName, Name: ""
                            }, fi_responsetext: responseText, fi_surveyresponse: {
                                    Id: this.SurveyResponseId, LogicalName: "fi_surveyresponse", Name: ""
                                }
                        };
                    service.CreateRecord(request, serverObject)
                };
                InputQuestionResponse.prototype.update = function(handler, service)
                {
                    var responseText = this.Value ? this.Value.toString() : null;
                    ;
                    var record = {fi_responsetext: responseText};
                    var request = new Fi.Crm.Request(QuestionResponseEntity.EntityName, handler.onSuccess, handler.onError);
                    service.UpdateRecord(request, this.Id, record)
                };
                InputQuestionResponse.prototype.isDirty = function()
                {
                    return this.initialValue !== this.Value
                };
                InputQuestionResponse.prototype.commit = function()
                {
                    this.initialValue = this.Value
                };
                InputQuestionResponse.prototype.setChildrenUniqueIds = function(id){};
                InputQuestionResponse.prototype.setDefaultValue = function(value)
                {
                    this.setInitalValue(value)
                };
                return InputQuestionResponse
            })(QuestionResponseEntity);
        Survey.InputQuestionResponse = InputQuestionResponse;
        var TextQuestionResponse = (function(_super)
            {
                __extends(TextQuestionResponse, _super);
                function TextQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject);
                    this.setInitalValue(serverObject.fi_responsetext)
                }
                return TextQuestionResponse
            })(InputQuestionResponse);
        Survey.TextQuestionResponse = TextQuestionResponse;
        var DateQuestionResponse = (function(_super)
            {
                __extends(DateQuestionResponse, _super);
                function DateQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject);
                    var responseDate = null;
                    if (serverObject.fi_responsetext)
                    {
                        responseDate = new Date(serverObject.fi_responsetext)
                    }
                    this.setInitalValue(responseDate)
                }
                return DateQuestionResponse
            })(InputQuestionResponse);
        Survey.DateQuestionResponse = DateQuestionResponse;
        var NumericQuestionResponse = (function(_super)
            {
                __extends(NumericQuestionResponse, _super);
                function NumericQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject);
                    var value = null;
                    if (serverObject.fi_responsetext)
                    {
                        value = parseInt(serverObject.fi_responsetext)
                    }
                    this.setInitalValue(value)
                }
                return NumericQuestionResponse
            })(InputQuestionResponse);
        Survey.NumericQuestionResponse = NumericQuestionResponse;
        var InformationQuestionResponse = (function(_super)
            {
                __extends(InformationQuestionResponse, _super);
                function InformationQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject);
                    this.Value = serverObject.fi_responsetext
                }
                InformationQuestionResponse.prototype.save = function(handler, service)
                {
                    handler.onSuccess()
                };
                InformationQuestionResponse.prototype.isDirty = function()
                {
                    return false
                };
                InformationQuestionResponse.prototype.commit = function(){};
                InformationQuestionResponse.prototype.setChildrenUniqueIds = function(id){};
                InformationQuestionResponse.prototype.setDefaultValue = function(value){};
                return InformationQuestionResponse
            })(QuestionResponseEntity);
        Survey.InformationQuestionResponse = InformationQuestionResponse;
        var MultipleOptionsQuestionResponse = (function(_super)
            {
                __extends(MultipleOptionsQuestionResponse, _super);
                function MultipleOptionsQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject);
                    if (serverObject.fi_questionresponse_fi_answeroptionresponse_questionresponseid)
                        this.Answers = this.getAnswerOptionResponses(serverObject.fi_questionresponse_fi_answeroptionresponse_questionresponseid);
                    else if (serverObject.fi_question_fi_answeroption)
                        this.Answers = this.getAnswerOptionResponsesNew(serverObject.fi_question_fi_answeroption)
                }
                MultipleOptionsQuestionResponse.prototype.getAnswerOptionResponses = function(relation)
                {
                    var _this = this;
                    var selectedResponses;
                    if (relation && relation.results && relation.results.length > 0)
                    {
                        var activeResults = _.filter(relation.results, function(result)
                            {
                                return result.statecode.Value == 0
                            });
                        selectedResponses = _.map(activeResults, function(serverObject)
                        {
                            return AnswerOptionResponseEntity.getFrom(_this.Id, serverObject)
                        })
                    }
                    else
                    {
                        selectedResponses = []
                    }
                    return selectedResponses
                };
                MultipleOptionsQuestionResponse.prototype.getAnswerOptionResponsesNew = function(relation)
                {
                    var selectedResponses;
                    if (relation && relation.results && relation.results.length > 0)
                    {
                        selectedResponses = _.map(relation.results, function(serverObject)
                        {
                            return AnswerOptionResponseEntity.getFromEmptyQuestionResponse(serverObject)
                        })
                    }
                    else
                    {
                        selectedResponses = []
                    }
                    return selectedResponses
                };
                MultipleOptionsQuestionResponse.prototype.setAnswersOptionResponses = function()
                {
                    var _this = this;
                    _.each(this.Question.AnswersOptions, function(option)
                    {
                        var response = _.find(_this.Answers, function(a)
                            {
                                return a.IsFor(option)
                            });
                        if (response)
                        {
                            response.SetAnswerOption(option)
                        }
                        else
                        {
                            response = new AnswerOptionResponseEntity(_this.Id, option);
                            _this.Answers.push(response)
                        }
                    });
                    this.Answers = _.sortBy(this.Answers, function(a)
                    {
                        return a.AnswerOption.OrderNumber
                    })
                };
                return MultipleOptionsQuestionResponse
            })(QuestionResponseEntity);
        Survey.MultipleOptionsQuestionResponse = MultipleOptionsQuestionResponse;
        var SingleChoiceQuestionResponse = (function(_super)
            {
                __extends(SingleChoiceQuestionResponse, _super);
                function SingleChoiceQuestionResponse(serverObject)
                {
                    _super.call(this, serverObject)
                }
                SingleChoiceQuestionResponse.prototype.isDirty = function()
                {
                    return this.isSelectionChanged() || (this.SelectedItem && this.SelectedItem.isDirty())
                };
                SingleChoiceQuestionResponse.prototype.isSelectionChanged = function()
                {
                    var isSelectionChanged = false;
                    if (this.SelectedItem)
                    {
                        if (this.initialSelection)
                        {
                            isSelectionChanged = this.initialSelection.AnswerOption.Id != this.SelectedItem.AnswerOption.Id
                        }
                        else
                        {
                            isSelectionChanged = true
                        }
                    }
                    else
                    {
                        if (this.initialSelection)
                        {
                            isSelectionChanged = true
                        }
                    }
                    return isSelectionChanged
                };
                SingleChoiceQuestionResponse.prototype.getUnselectedItem = function()
                {
                    if (this.initialSelection && this.isSelectionChanged())
                    {
                        return this.initialSelection
                    }
                    return null
                };
                SingleChoiceQuestionResponse.prototype.commit = function()
                {
                    this.initialSelection = this.SelectedItem;
                    if (this.initialSelection)
                    {
                        this.initialSelection.commit()
                    }
                };
                SingleChoiceQuestionResponse.prototype.setInitialSelection = function(value)
                {
                    if (typeof value === "undefined")
                    {
                        value = null
                    }
                    this.initialSelection = value;
                    this.SelectedItem = value;
                    this.SelectedValue = value ? value.AnswerOption.Id : "";
                    this.IsInvalid = false
                };
                SingleChoiceQuestionResponse.prototype.save = function(handler, service)
                {
                    if (this.Id)
                    {
                        if (this.isDirty())
                        {
                            this.update(handler, service)
                        }
                        else
                        {
                            handler.onSuccess()
                        }
                    }
                    else
                    {
                        this.create(handler, service)
                    }
                };
                SingleChoiceQuestionResponse.prototype.update = function(handler, service)
                {
                    var tasks = new Async.TasksExecutor(handler);
                    var unselected = this.getUnselectedItem();
                    if (unselected && unselected.Id)
                    {
                        var selected = this.SelectedItem;
                        if (selected && !selected.IsFor(Survey.AnswerOption.Empty))
                        {
                            selected.Id = unselected.Id;
                            var selectTask = Async.Task.New();
                            selectTask.operation = function(operationHandler)
                            {
                                selected.update(operationHandler, service)
                            };
                            tasks.Add(selectTask)
                        }
                        else
                        {
                            var unselectTask = Async.Task.New();
                            unselectTask.operation = function(operationHandler)
                            {
                                unselected.deactivateRecord(operationHandler, service)
                            };
                            tasks.Add(unselectTask)
                        }
                    }
                    else
                    {
                        var selected = this.SelectedItem;
                        if (selected && !selected.IsFor(Survey.AnswerOption.Empty))
                        {
                            var selectTask = Async.Task.New();
                            selectTask.operation = function(operationHandler)
                            {
                                selected.save(operationHandler, service)
                            };
                            tasks.Add(selectTask)
                        }
                    }
                    tasks.Execute()
                };
                SingleChoiceQuestionResponse.prototype.create = function(handler, service)
                {
                    var _this = this;
                    var _this = this;
                    var onSuccess = function(data)
                        {
                            var recordId = data.d.fi_questionresponseId;
                            _this.Id = recordId;
                            if (_this.Answers && _this.Answers.length > 0)
                            {
                                _.each(_this.Answers, function(answer)
                                {
                                    answer.QuestionResponseId = recordId
                                })
                            }
                            _this.update(handler, service)
                        };
                    var request = new Fi.Crm.Request(QuestionResponseEntity.EntityName, onSuccess, handler.onError);
                    var serverObject = {
                            fi_questionid: {
                                Id: this.QuestionId, LogicalName: Survey.Question.EntityName, Name: ""
                            }, fi_surveyresponse: {
                                    Id: this.SurveyResponseId, LogicalName: "fi_surveyresponse", Name: ""
                                }
                        };
                    service.CreateRecord(request, serverObject)
                };
                SingleChoiceQuestionResponse.prototype.setChildrenUniqueIds = function(id)
                {
                    if (this.Answers)
                    {
                        _.each(this.Answers, function(answer)
                        {
                            answer.EntityUniqueId = id
                        })
                    }
                };
                SingleChoiceQuestionResponse.prototype.setDefaultValue = function(value){};
                return SingleChoiceQuestionResponse
            })(MultipleOptionsQuestionResponse);
        Survey.SingleChoiceQuestionResponse = SingleChoiceQuestionResponse;
        var SingleSelectionQuestionReponse = (function(_super)
            {
                __extends(SingleSelectionQuestionReponse, _super);
                function SingleSelectionQuestionReponse()
                {
                    _super.apply(this, arguments)
                }
                SingleSelectionQuestionReponse.prototype.setQuestion = function(question)
                {
                    _super.prototype.setQuestion.call(this, question);
                    this.setSelectionAndAddNullOption();
                    this.setAnswersOptionResponses()
                };
                SingleSelectionQuestionReponse.prototype.setSelectionAndAddNullOption = function()
                {
                    var nullSelection = new AnswerOptionResponseEntity(this.Id, Survey.AnswerOption.Empty);
                    var selectedOption = _.first(this.Answers);
                    if (!selectedOption)
                    {
                        selectedOption = nullSelection
                    }
                    this.setInitialSelection(selectedOption);
                    this.Answers.unshift(nullSelection)
                };
                SingleSelectionQuestionReponse.prototype.SetChildrenUniqueIds = function(id)
                {
                    if (this.Answers)
                    {
                        _.each(this.Answers, function(answer)
                        {
                            answer.EntityUniqueId = id
                        })
                    }
                };
                SingleSelectionQuestionReponse.prototype.SetDefaultValue = function(value){};
                return SingleSelectionQuestionReponse
            })(SingleChoiceQuestionResponse);
        Survey.SingleSelectionQuestionReponse = SingleSelectionQuestionReponse;
        var TwoOptionsQuestionResponse = (function(_super)
            {
                __extends(TwoOptionsQuestionResponse, _super);
                function TwoOptionsQuestionResponse()
                {
                    _super.apply(this, arguments)
                }
                TwoOptionsQuestionResponse.prototype.setQuestion = function(question)
                {
                    _super.prototype.setQuestion.call(this, question);
                    this.setSelection();
                    this.setAnswersOptionResponses()
                };
                TwoOptionsQuestionResponse.prototype.setSelection = function()
                {
                    var selectedOption = _.first(this.Answers);
                    this.setInitialSelection(selectedOption)
                };
                return TwoOptionsQuestionResponse
            })(SingleChoiceQuestionResponse);
        Survey.TwoOptionsQuestionResponse = TwoOptionsQuestionResponse;
        var MultipleSelectionQuestionResponse = (function(_super)
            {
                __extends(MultipleSelectionQuestionResponse, _super);
                function MultipleSelectionQuestionResponse()
                {
                    _super.apply(this, arguments)
                }
                MultipleSelectionQuestionResponse.prototype.setQuestion = function(question)
                {
                    _super.prototype.setQuestion.call(this, question);
                    this.initialSelections = _.filter(this.Answers, function(a)
                    {
                        return a.IsSelected === true
                    });
                    this.setAnswersOptionResponses()
                };
                MultipleSelectionQuestionResponse.prototype.getSelectedItems = function()
                {
                    var currentSelection = _.filter(this.Answers, function(a)
                        {
                            return a.IsSelected
                        });
                    return currentSelection
                };
                MultipleSelectionQuestionResponse.prototype.getUnselectedItems = function()
                {
                    var difference = [];
                    if (this.isDirty())
                    {
                        var idsForDifference = this.projectAndEvaluate(this.initialSelections, this.getSelectedItems(), function(firstProjection, secondProjection)
                            {
                                return _.difference(firstProjection, secondProjection)
                            });
                        if (idsForDifference.length > 0)
                        {
                            difference = _.filter(this.initialSelections, function(answer)
                            {
                                return _.contains(idsForDifference, answer.AnswerOption.Id)
                            })
                        }
                    }
                    return difference
                };
                MultipleSelectionQuestionResponse.prototype.projectAndEvaluate = function(first, second, evaluate)
                {
                    var projection = function(a)
                        {
                            return a.AnswerOption.Id
                        };
                    var firstProjection = _.map(first, projection);
                    var secondProjection = _.map(second, projection);
                    return evaluate(firstProjection, secondProjection)
                };
                MultipleSelectionQuestionResponse.prototype.isDirty = function()
                {
                    var currentSelection = this.getSelectedItems();
                    var isDirty = this.projectAndEvaluate(currentSelection, this.initialSelections, function(firstProjection, secondProjection)
                        {
                            return !_.isEqual(firstProjection, secondProjection)
                        });
                    if (isDirty === false)
                    {
                        isDirty = _.any(currentSelection, function(a)
                        {
                            return a.isDirty()
                        })
                    }
                    return isDirty
                };
                MultipleSelectionQuestionResponse.prototype.commit = function()
                {
                    this.initialSelections = this.getSelectedItems();
                    _.each(this.initialSelections, function(a)
                    {
                        return a.commit()
                    })
                };
                MultipleSelectionQuestionResponse.prototype.save = function(handler, service)
                {
                    if (this.Id)
                    {
                        if (this.isDirty())
                        {
                            this.update(handler, service)
                        }
                        else
                        {
                            handler.onSuccess()
                        }
                    }
                    else
                    {
                        this.create(handler, service)
                    }
                };
                MultipleSelectionQuestionResponse.prototype.update = function(handler, service)
                {
                    var tasks = new Async.TasksExecutor(handler);
                    var initialOptions = this.getUnselectedItems();
                    if (initialOptions.length > 0)
                    {
                        _.each(initialOptions, function(answer)
                        {
                            var task = Async.Task.New();
                            task.operation = function(deleteHandler)
                            {
                                answer.deactivateRecord(deleteHandler, service)
                            };
                            tasks.Add(task)
                        })
                    }
                    var selectedOptions = this.getSelectedItems();
                    if (selectedOptions.length > 0)
                    {
                        _.each(selectedOptions, function(answer)
                        {
                            var task = Async.Task.New();
                            task.operation = function(saveHandler)
                            {
                                answer.save(saveHandler, service)
                            };
                            tasks.Add(task)
                        })
                    }
                    tasks.Execute()
                };
                MultipleSelectionQuestionResponse.prototype.create = function(handler, service)
                {
                    var _this = this;
                    var _this = this;
                    var onSuccess = function(data)
                        {
                            var recordId = data.d.fi_questionresponseId;
                            _this.Id = recordId;
                            if (_this.Answers && _this.Answers.length > 0)
                            {
                                _.each(_this.Answers, function(answer)
                                {
                                    answer.QuestionResponseId = recordId
                                })
                            }
                            _this.update(handler, service)
                        };
                    var request = new Fi.Crm.Request(QuestionResponseEntity.EntityName, onSuccess, handler.onError);
                    var serverObject = {
                            fi_questionid: {
                                Id: this.QuestionId, LogicalName: Survey.Question.EntityName, Name: ""
                            }, fi_surveyresponse: {
                                    Id: this.SurveyResponseId, LogicalName: "fi_surveyresponse", Name: ""
                                }
                        };
                    service.CreateRecord(request, serverObject)
                };
                MultipleSelectionQuestionResponse.prototype.setChildrenUniqueIds = function(id)
                {
                    if (this.Answers)
                    {
                        _.each(this.Answers, function(answer)
                        {
                            answer.EntityUniqueId = id
                        })
                    }
                };
                MultipleSelectionQuestionResponse.prototype.setDefaultValue = function(value){};
                return MultipleSelectionQuestionResponse
            })(MultipleOptionsQuestionResponse);
        Survey.MultipleSelectionQuestionResponse = MultipleSelectionQuestionResponse
    })(Fi.Survey || (Fi.Survey = {}));
    var Survey = Fi.Survey
})(Fi || (Fi = {}));
var Fi;
(function(Fi)
{
    (function(Survey)
    {
        var SurveyServiceNew = (function()
            {
                function SurveyServiceNew(serverUrl, surveyId, surveyResponseId, contactId, surveyName)
                {
                    this.emptyQuestionResponses = new Array;
                    this.surveyQuestionResponses = new Array;
                    this.service = new Fi.Crm.Service(serverUrl);
                    this.surveyId = surveyId;
                    this.surveyResponseId = surveyResponseId;
                    this.contactId = contactId;
                    this.surveyName = surveyName
                }
                SurveyServiceNew.prototype.GetSurveyResponseId = function()
                {
                    return this.surveyResponseId
                };
                SurveyServiceNew.prototype.GetSurveyInfo = function(onSuccess, onError)
                {
                    if (this.surveyId)
                    {
                        var getSurveyDataQuery = new Fi.Crm.Request("fi_survey", onSuccess, onError);
                        var query = "$select=fi_id,fi_id_search,fi_name,fi_isdisabledonedit,fi_only1percustomer";
                        this.service.Retrieve(getSurveyDataQuery, this.surveyId, query)
                    }
                };
                SurveyServiceNew.prototype.CheckDuplicateSurveyResponse = function(onSuccess, onError)
                {
                    if (this.surveyId && this.contactId)
                    {
                        var getSurveyResponseDataQuery = new Fi.Crm.Request("fi_surveyresponse", onSuccess, onError);
                        var query = "$select=fi_surveyresponseId&$filter=fi_contactid/Id eq " + Fi.Crm.RequestHelper.GuidToString(this.contactId) + " and fi_surveyid/Id eq " + Fi.Crm.RequestHelper.GuidToString(this.surveyId) + " and statecode/Value eq 0";
                        this.service.RetrieveMultiple(getSurveyResponseDataQuery, query)
                    }
                };
                SurveyServiceNew.prototype.GetQuestionResponsesNew = function(onDataRetrieved, onError)
                {
                    var _this = this;
                    if (this.surveyId)
                    {
                        var handlers = new Survey.RequestHandlers(onDataRetrieved, onError);
                        var onSuccess = function(questions)
                            {
                                return _this.onQuestionRetrievedNew(questions, handlers)
                            };
                        /*    
                        var getAnswerOptionsForQuestions = new Fi.Crm.Request("fi_question", onSuccess, onError);
                        var query = "$select=fi_answertype,fi_description,fi_hasseparator,fi_ordernumber,fi_questionId,fi_questiontext" + ",fi_question_fi_answeroption/fi_answer,fi_question_fi_answeroption/fi_answeroptionId,fi_question_fi_answeroption/fi_istextresponserequired, fi_question_fi_answeroption/fi_ordernumber, fi_question_fi_answeroption/fi_textresponsetype" + "&$expand=fi_question_fi_answeroption" + "&$filter=statecode/Value eq 0 and fi_surveyid/Id eq " + Fi.Crm.RequestHelper.GuidToString(this.surveyId);
                        this.service.RetrieveMultiple(getAnswerOptionsForQuestions, query)
                        */
                        //IRIS-1725 OData can only pull no more than 50 records in expansition. Switch to FetchXML
                        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"+
                                            "<entity name='fi_question'>"+
                                                "<attribute name='fi_answertype' />"+
                                                "<attribute name='fi_description' />"+
                                                "<attribute name='fi_hasseparator' />"+
                                                "<attribute name='fi_ordernumber' />"+
                                                "<attribute name='fi_questionid' />"+
                                                "<attribute name='fi_questiontext' />"+
                                                "<link-entity name='fi_question_fi_answeroption' from='fi_questionid' to='fi_questionid' link-type='outer' alias='qa'>"+
                                                    "<link-entity name='fi_answeroption' from='fi_answeroptionid' to='fi_answeroptionid' link-type='outer' alias='a'>"+
                                                        "<attribute name='fi_answer' />"+
                                                        "<attribute name='fi_answeroptionid' />"+
                                                        "<attribute name='fi_istextresponserequired' />"+
                                                        "<attribute name='fi_ordernumber' />"+
                                                        "<attribute name='fi_textresponsetype' />"+
                                                    "</link-entity>"+
                                                "</link-entity>"+
                                                "<order attribute='fi_ordernumber' descending='false' />"+
                                                "<filter type='and'>"+
                                                    "<condition attribute='statecode' operator='eq' value='0' />"+
                                                    "<condition attribute='fi_surveyid' operator='eq' value='" + this.surveyId +"' />"+
                                                "</filter>"+
                                            "</entity>"+
                                        "</fetch>";
                                        debugger;
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
                SurveyServiceNew.prototype.onQuestionRetrievedNew = function(questions, handlers)
                {
                debugger;
                    this.emptyQuestionResponses = this.getEmptyQuestionResponses(questions);
                    if (this.surveyResponseId)
                    {
                        this.GetQuestionResponses(handlers)
                    }
                    else
                    {
                        this.surveyQuestionResponses = new Array;
                        this.mergeAndReturnData(handlers)
                    }
                };
                SurveyServiceNew.prototype.getEmptyQuestionResponses = function(questions)
                {
                    var result = new Array;
                    _.each(questions, function(serverQuestion)
                    {
                        var question = SurveyServiceNew.ToQuestion(serverQuestion);
                        serverQuestion.fi_questionid = question;
                        serverQuestion.fi_responsetext = "";
                        serverQuestion.fi_questionresponseId = null;
                        var qr = SurveyServiceNew.getQuestionResponseNew(serverQuestion);
                        if (qr)
                        {
                            qr.Question = null;
                            if (qr.Answers)
                            {
                                qr.Answers = new Array
                            }
                            qr.initialValue = "";
                            qr.value = "";
                            qr.setQuestion(question);
                            result.push(qr)
                        }
                    });
                    return result
                };
                SurveyServiceNew.prototype.getSurveyQuestionResponses = function(handlers)
                {
                    var _this = this;
                    var onSuccess = function(data)
                        {
                            return _this.onSurveyQuestionsResponsesRetreived(data, handlers)
                        };
                    var getQuestionsResponses = new Fi.Crm.Request(Survey.QuestionResponseEntity.EntityName, onSuccess, handlers.onError);
                    var query = "$select=fi_questionresponseId,fi_questionid,fi_responsetext" + ",fi_questionresponse_fi_answeroptionresponse_questionresponseid/fi_additionaltext,fi_questionresponse_fi_answeroptionresponse_questionresponseid/fi_answeroptionid,fi_questionresponse_fi_answeroptionresponse_questionresponseid/fi_answeroptionresponseId" + ",fi_question_fi_questionresponse_questionid/fi_answertype" + "&$expand=fi_questionresponse_fi_answeroptionresponse_questionresponseid, fi_question_fi_questionresponse_questionid" + "&$filter=statecode/Value eq 0 and fi_surveyresponse/Id eq " + Fi.Crm.RequestHelper.GuidToString(this.surveyResponseId);
                    this.service.RetrieveMultiple(getQuestionsResponses, query)
                };
                SurveyServiceNew.prototype.mergeAndReturnData = function(handlers)
                {
                    this.mergeSurveyQuestionResponsesWithQuestions();
                    this.surveyQuestionResponses = _.filter(this.surveyQuestionResponses, function(r)
                    {
                        return r.Question != undefined
                    });
                    this.surveyQuestionResponses = _.sortBy(this.surveyQuestionResponses, function(r)
                    {
                        return r.Question.OrderNumber
                    });
                    handlers.onSuccess(this.surveyQuestionResponses)
                };
                SurveyServiceNew.prototype.onSurveyQuestionsResponsesRetreived = function(data, handlers)
                {
                    this.surveyQuestionResponses = SurveyServiceNew.toQuestionResponsesNew(data);
                    this.mergeAndReturnData(handlers)
                };
                SurveyServiceNew.toQuestionResponsesNew = function(serverResults)
                {
                    var questionsResponses = [];
                    _.each(serverResults, function(serverObject)
                    {
                        var qr = SurveyServiceNew.getQuestionResponseNew(serverObject);
                        if (qr)
                        {
                            questionsResponses.push(qr)
                        }
                    });
                    return questionsResponses
                };
                SurveyServiceNew.getQuestionResponseNew = function(serverObject)
                {
                    var questionType = serverObject.fi_question_fi_questionresponse_questionid ? serverObject.fi_question_fi_questionresponse_questionid.fi_answertype.Value : serverObject.fi_answertype.Value;
                    var qr;
                    switch (questionType)
                    {
                        case Survey.AnswerType.Text:
                        case Survey.AnswerType.MultilineText:
                            qr = new Survey.TextQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.Numeric:
                            qr = new Survey.NumericQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.Date:
                            qr = new Survey.DateQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.Information:
                            qr = new Survey.InformationQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.TwoOptions:
                            qr = new Survey.TwoOptionsQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.SingleSelection:
                            qr = new Survey.SingleSelectionQuestionReponse(serverObject);
                            break;
                        case Survey.AnswerType.MultipleSelection:
                            qr = new Survey.MultipleSelectionQuestionResponse(serverObject);
                            break
                    }
                    qr.Question = serverObject.fi_questionid;
                    return qr
                };
                SurveyServiceNew.prototype.mergeSurveyQuestionResponsesWithQuestions = function()
                {
                    var _this = this;
                    _.each(this.emptyQuestionResponses, function(eqr)
                    {
                        var surveyQuestionResponse = _.find(_this.surveyQuestionResponses, function(sqr)
                            {
                                return sqr.isFor(eqr.Question)
                            });
                        if (!surveyQuestionResponse)
                        {
                            _this.surveyQuestionResponses.push(eqr)
                        }
                    })
                };
                SurveyServiceNew.ToQuestion = function(serverResult)
                {
                    var answerType = serverResult.fi_answertype.Value;
                    var question = new Survey.Question(serverResult.fi_questionId, serverResult.fi_questiontext, answerType, serverResult.fi_ordernumber, serverResult.fi_description, serverResult.fi_hasseparator);
                    var options = _.map(serverResult.fi_question_fi_answeroption.results, function(serverOption)
                        {
                            return new Survey.AnswerOption(serverOption.fi_answeroptionId, serverOption.fi_answer, serverOption.fi_istextresponserequired, serverOption.fi_ordernumber, serverOption.fi_textresponsetype)
                        });
                    options = _.sortBy(options, function(o)
                    {
                        return o.OrderNumber
                    });
                    question.SetAnswerOptions(options);
                    return question
                };
                SurveyServiceNew.prototype.GetQuestionResponses = function(handlers)
                {
                    var _this = this;
                    var onSuccess = function(data)
                        {
                            return _this.onQuestionsResponsesRetreived(data, handlers)
                        };
                    var getQuestionsResponses = new Fi.Crm.Request(Survey.QuestionResponseEntity.EntityName, onSuccess, handlers.onError);
                    var query = "$select=fi_questionresponseId,fi_questionid,fi_responsetext," + "fi_questionresponse_fi_answeroptionresponse_questionresponseid/fi_additionaltext," + "fi_questionresponse_fi_answeroptionresponse_questionresponseid/fi_answeroptionid," + "fi_questionresponse_fi_answeroptionresponse_questionresponseid/fi_answeroptionresponseId," + "fi_questionresponse_fi_answeroptionresponse_questionresponseid/statecode," + "fi_question_fi_questionresponse_questionid/fi_answertype" + "&$expand=fi_questionresponse_fi_answeroptionresponse_questionresponseid, fi_question_fi_questionresponse_questionid" + "&$filter=statecode/Value eq 0 " + "and fi_surveyresponse/Id eq " + Fi.Crm.RequestHelper.GuidToString(this.surveyResponseId);
                    this.service.RetrieveMultiple(getQuestionsResponses, query)
                };
                SurveyServiceNew.prototype.onQuestionsResponsesRetreived = function(data, handlers)
                {
                    this.surveyQuestionResponses = SurveyServiceNew.toQuestionResponses(data);
                    if (this.surveyQuestionResponses.length > 0)
                    {
                        this.getQuestionsAndAnswerOptions(handlers)
                    }
                    else
                    {
                        this.mergeAndReturnData(handlers)
                    }
                };
                SurveyServiceNew.toQuestionResponses = function(serverResults)
                {
                    var questionsResponses = [];
                    _.each(serverResults, function(serverObject)
                    {
                        var qr = SurveyServiceNew.getQuestionResponse(serverObject);
                        if (qr)
                        {
                            questionsResponses.push(qr)
                        }
                    });
                    return questionsResponses
                };
                SurveyServiceNew.getQuestionResponse = function(serverObject)
                {
                    var questionType = serverObject.fi_question_fi_questionresponse_questionid.fi_answertype.Value;
                    var qr;
                    switch (questionType)
                    {
                        case Survey.AnswerType.Text:
                        case Survey.AnswerType.MultilineText:
                            qr = new Survey.TextQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.Numeric:
                            qr = new Survey.NumericQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.Date:
                            qr = new Survey.DateQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.Information:
                            qr = new Survey.InformationQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.TwoOptions:
                            qr = new Survey.TwoOptionsQuestionResponse(serverObject);
                            break;
                        case Survey.AnswerType.SingleSelection:
                            qr = new Survey.SingleSelectionQuestionReponse(serverObject);
                            break;
                        case Survey.AnswerType.MultipleSelection:
                            qr = new Survey.MultipleSelectionQuestionResponse(serverObject);
                            break
                    }
                    return qr
                };
                SurveyServiceNew.prototype.getQuestionsAndAnswerOptions = function(handlers)
                {
                    var _this = this;
                    var onDataRetrieved = function(data)
                        {
                            _this.onQuestionsAndAnswerOptionsRetrieved(data, handlers)
                        };
                    var getAnswerOptionsForQuestions = new Fi.Crm.Request("fi_question", onDataRetrieved, handlers.onError);
                    var query = "$select=fi_answertype,fi_description,fi_hasseparator,fi_ordernumber,fi_questionId,fi_questiontext" + ",fi_question_fi_answeroption/fi_answer,fi_question_fi_answeroption/fi_answeroptionId,fi_question_fi_answeroption/fi_istextresponserequired, fi_question_fi_answeroption/fi_ordernumber, fi_question_fi_answeroption/fi_textresponsetype" + "&$expand=fi_question_fi_answeroption" + "&$filter=statecode/Value eq 0 and fi_surveyid/Id eq " + Fi.Crm.RequestHelper.GuidToString(this.surveyId);
                    this.service.RetrieveMultiple(getAnswerOptionsForQuestions, query)
                };
                SurveyServiceNew.prototype.onQuestionsAndAnswerOptionsRetrieved = function(data, handlers)
                {
                    var _this = this;
                    _.each(data, function(serverQuestion)
                    {
                        var question = SurveyServiceNew.ToQuestion(serverQuestion);
                        var qr = _.find(_this.surveyQuestionResponses, function(response)
                            {
                                return response.isFor(question)
                            });
                        if (qr)
                        {
                            qr.setQuestion(question)
                        }
                    });
                    this.mergeAndReturnData(handlers)
                };
                SurveyServiceNew.prototype.SaveQuestionResponsesNew = function(responses, onSuccess, onError, surveyResponseId)
                {
                    var _this = this;
                    var tasks = new Async.TasksExecutor(new Async.OperationCompletedHandler(onSuccess, onError));
                    _.each(responses, function(qr)
                    {
                        if (!qr.Id)
                        {
                            qr.setParent(surveyResponseId)
                        }
                    });
                    _.each(responses, function(qr)
                    {
                        if (qr.isDirty() || (!qr.Id))
                        {
                            try
                            {
                                var t = Async.Task.New(function()
                                    {
                                        return qr.commit()
                                    });
                                t.operation = function(handler)
                                {
                                    qr.save(handler, _this.service)
                                };
                                tasks.Add(t)
                            }
                            catch(e)
                            {
                                onError(e)
                            }
                        }
                    });
                    tasks.Execute()
                };
                SurveyServiceNew.prototype.SaveSurveyResponse = function(responses, onSuccess, onError)
                {
                    var _this = this;
                    var onSuccessSave = function(data)
                        {
                            var recordId = data.d.fi_surveyresponseId;
                            _this.surveyResponseId = recordId;
                            if (!onError)
                            {
                                onError = function(error)
                                {
                                    alert(error.message)
                                }
                            }
                            _this.SaveQuestionResponsesNew(responses, onSuccess, onError, recordId)
                        };
                    var onErrorSave = function(error)
                        {
                            alert(error.message)
                        };
                    var request = new Fi.Crm.Request("fi_surveyresponse", onSuccessSave, onErrorSave);
                    var serverObject = {
                            fi_surveyid: {
                                Id: this.surveyId, LogicalName: "fi_survey", Name: ""
                            }, fi_contactid: {
                                    Id: this.contactId, LogicalName: Survey.QuestionResponseEntity.EntityName, Name: ""
                                }, fi_name: this.surveyName
                        };
                    this.service.CreateRecord(request, serverObject)
                };
                return SurveyServiceNew
            })();
        Survey.SurveyServiceNew = SurveyServiceNew
    })(Fi.Survey || (Fi.Survey = {}));
    var Survey = Fi.Survey
})(Fi || (Fi = {}));
var Fi;
(function(Fi)
{
    (function(Survey)
    {
        var SurveyResponseViewModelNew = (function()
            {
                function SurveyResponseViewModelNew(isDisabled, surveyService, surveyInfo)
                {
                    if (!isDisabled && !surveyService)
                        throw new Error("Undefined or null argument: surveyService.");
                    this.responsesNew = [];
                    this.surveyService = surveyService;
                    this.IsDisabled = isDisabled;
                    this.userMessage = null;
                    this.DateFormat = "M/d/yyyy";
                    this.surveyInfo = surveyInfo;
                    this.accountResponses = [];
                    this.accountTotal = 0;
                    this.accountTotalQuestionResponse = undefined
                }
                ;
                var AccountModel = function(questionResponseId, uniqueId, additionalText)
                    {
                        this.questionResponseId = questionResponseId;
                        this.uniqueId = uniqueId;
                        this.additionalText = additionalText
                    };
                SurveyResponseViewModelNew.prototype.LoadResponses = function(isFirstLoad, isCreate)
                {
                    var _this = this;
                    var presenter = FisherJS.Survey.Utils.Presenter;
                    var onSuccess = function(data)
                        {
                            _this.OnQuestionResponsesRetrievedNew(data, isCreate);
                            _this.pageLoadCompleted();
                            presenter.showHideLoading(false)
                        };
                    var onError = function(error)
                        {
                            presenter.showHideLoading(false);
                            _this.ShowError("Unable to load the question responses. Error: " + error.message)
                        };
                    if (!isFirstLoad)
                    {
                        presenter.showHideLoading(true)
                    }
                    this.surveyService.GetQuestionResponsesNew(onSuccess, onError)
                };
                SurveyResponseViewModelNew.prototype.OnQuestionResponsesRetrievedNew = function(responses, isCreate)
                {
                    var isDisabled = this.IsDisabled;
                    _.each(responses, function(response)
                    {
                        var guid = kendo.guid();
                        response.EntityUniqueId = guid;
                        response.setChildrenUniqueIds(guid)
                    });
                    if (this.surveyInfo.isNineQuestionSurvey() && isCreate && !isDisabled)
                    {
                        responses = setAdditionalInfo(responses, this.surveyInfo.additionalInfo)
                    }
                    ;
                    var observableResponses = kendo.observableHierarchy(responses);
                    ((this)).set("responsesNew", observableResponses);
                    if (this.surveyInfo.isInitialSurvey())
                    {
                        setInitialReviewAccounts(this)
                    }
                    ;
                };
                function setAdditionalInfo(responses, additionalInfo)
                {
                    _.each(responses, function(qr)
                    {
                        var tempResponse = qr;
                        if (tempResponse.Question)
                        {
                            if (tempResponse.Question.IsNetworkIdQuestion())
                            {
                                qr.setDefaultValue(additionalInfo.networkId);
                                qr.IsDisabled = true
                            }
                            if (tempResponse.Question.IsContactIdQuestion())
                            {
                                qr.setDefaultValue(additionalInfo.contactId);
                                qr.IsDisabled = true
                            }
                            if (tempResponse.Question.IsClientLastNameQuestion())
                            {
                                qr.setDefaultValue(additionalInfo.clientLastName);
                                qr.IsDisabled = true
                            }
                            if (tempResponse.Question.IsLastNameICQuestion())
                            {
                                qr.setDefaultValue(additionalInfo.lastNameICAssigned);
                                qr.IsDisabled = true
                            }
                        }
                    });
                    return responses
                }
                SurveyResponseViewModelNew.prototype.pageLoadCompleted = function()
                {
                    var _this = this;
                    $("tr:odd").css("background-color", "#F8F8F8");
                    _.each(this.responsesNew, function(qr)
                    {
                        if (qr.Question.AnswerType === Survey.AnswerType.TwoOptions)
                        {
                            if (qr.SelectedValue !== "")
                            {
                                var selectedAnswer = _.find(qr.Answers, function(aor)
                                    {
                                        return aor.AnswerOption.Id === qr.SelectedValue
                                    });
                                if (selectedAnswer)
                                {
                                    _this.setSelectedItem(qr, selectedAnswer)
                                }
                            }
                        }
                    })
                };
                function setInitialReviewAccounts(viewModel)
                {
                    amplify.subscribe("InitialSurvey.AccountChange", function(data)
                    {
                        updateAccountResponses(data, viewModel);
                        calculateTotalAccount(viewModel);
                        updateTotalAccountQuestion(viewModel)
                    });
                    _.each(viewModel.responsesNew, function(qr)
                    {
                        var qrLower = qr.Question.QuestionText.toLowerCase();
                        if (qr.Question.IsAccountTotalQuestion())
                        {
                            viewModel.accountTotalQuestionResponse = qr;
                            viewModel.accountTotalQuestionResponse.set("IsDisabled", true)
                        }
                        if (qr.Question.IsAccountQuestion())
                        {
                            viewModel.accountResponses.push(new AccountModel(qr.SelectedItem.QuestionResponseId, qr.SelectedItem.EntityUniqueId, qr.SelectedItem.AdditionalText))
                        }
                    })
                }
                ;
                function updateAccountResponses(data, viewModel)
                {
                    var response = null;
                    _.each(viewModel.accountResponses, function(accResponse)
                    {
                        if (accResponse.uniqueId == data.uniqueId)
                        {
                            response = accResponse;
                            accResponse.additionalText = data.additionalText
                        }
                    });
                    if (response == null)
                    {
                        viewModel.accountResponses.push(new AccountModel(data.questionResponseId, data.uniqueId, data.additionalText))
                    }
                    ;
                }
                ;
                function calculateTotalAccount(viewModel)
                {
                    viewModel.accountTotal = 0;
                    _.each(viewModel.accountResponses, function(response)
                    {
                        var accountValue = getAccountValue(response.additionalText);
                        viewModel.accountTotal += accountValue
                    })
                }
                ;
                function getAccountValue(additionalText)
                {
                    var accountValue = 0;
                    if (Fi.Utils.InputValidation.isValidNumericAnswer(additionalText))
                    {
                        var resp = additionalText;
                        accountValue = parseInt(resp)
                    }
                    return isNaN(accountValue) ? 0 : accountValue
                }
                ;
                function updateTotalAccountQuestion(viewModel)
                {
                    var qr = viewModel.accountTotalQuestionResponse;
                    if (qr)
                    {
                        qr.set("Value", viewModel.accountTotal)
                    }
                }
                ;
                SurveyResponseViewModelNew.prototype.SaveQuestionResponses = function(onCompletion)
                {
                    var _this = this;
                    if (!this.IsDisabled)
                    {
                        var validationResult = this.validateResponses();
                        if (!validationResult)
                        {
                            this.ShowError("Validation error: " + this.validationErrorMessage);
                            onCompletion(false);
                            return
                        }
                        var onSuccess = function()
                            {
                                _this.ShowSuccess("Data successfully saved.");
                                onCompletion(true)
                            };
                        var onError = function(error)
                            {
                                _this.ShowError("Unable to save changes. Error: " + error.message);
                                onCompletion(false)
                            };
                        this.surveyService.SaveQuestionResponsesNew(this.responsesNew, onSuccess, onError, this.surveyService.GetSurveyResponseId())
                    }
                };
                SurveyResponseViewModelNew.prototype.SaveSurveyResponse = function(onCompletion)
                {
                    var _this = this;
                    if (!this.IsDisabled)
                    {
                        var validationResult = this.validateResponses();
                        if (!validationResult)
                        {
                            this.ShowError("Validation error: " + this.validationErrorMessage);
                            onCompletion(false);
                            return false
                        }
                        var onSuccess = function()
                            {
                                _this.ShowSuccess("Data successfully saved.");
                                onCompletion(true)
                            };
                        var onError = function(error)
                            {
                                _this.ShowError("Unable to save changes. Error: " + error.message);
                                onCompletion(false)
                            };
                        this.surveyService.SaveSurveyResponse(this.responsesNew, onSuccess, onError)
                    }
                };
                SurveyResponseViewModelNew.prototype.validateResponses = function()
                {
                    this.validationErrorMessage = "";
                    this.validateNumericAswers();
                    if (this.surveyInfo.isInitialSurvey())
                    {
                        this.validateAccountsAnswers()
                    }
                    return !(Fi.Utils.InputValidation.hasValue(this.validationErrorMessage))
                };
                SurveyResponseViewModelNew.prototype.getAnswersToValidate = function()
                {
                    var self = this;
                    var answers = _.pluck(this.responsesNew, "SelectedItem");
                    answers = _.filter(answers, function(a)
                    {
                        return (a)
                    });
                    return answers
                };
                SurveyResponseViewModelNew.prototype.checkNumericAnswers = function(answers)
                {
                    var self = this;
                    _.each(answers, function(a)
                    {
                        a.set("IsInvalid", false);
                        if (a.AnswerOption && a.AnswerOption.IsTextResponseNumeric())
                        {
                            if (Fi.Utils.InputValidation.hasValue(a.AdditionalText) && !$.isNumeric(a.AdditionalText))
                            {
                                self.validationErrorMessage = "Some responses should contain only numeric characters.";
                                a.set("IsInvalid", true)
                            }
                        }
                    })
                };
                SurveyResponseViewModelNew.prototype.validateNumericAswers = function()
                {
                    var answers = this.getAnswersToValidate();
                    this.checkNumericAnswers(answers)
                };
                SurveyResponseViewModelNew.prototype.getAccountAnswersToValidate = function()
                {
                    var self = this,
                        accountResponses = _.filter(this.responsesNew, function(response)
                        {
                            return response.Question.IsAccountQuestion()
                        }),
                        responses = _.pluck(accountResponses, "SelectedItem"),
                        responsesWithValues = _.filter(responses, function(r)
                        {
                            return (r)
                        });
                    return responsesWithValues
                };
                SurveyResponseViewModelNew.prototype.validateAccountsAnswers = function()
                {
                    var self = this,
                        accountAnswers = this.getAccountAnswersToValidate(),
                        isAnyInvalidAccountValue = false;
                    _.each(accountAnswers, function(a)
                    {
                        if (Fi.Utils.InputValidation.hasValue(a.AdditionalText) && !Fi.Utils.InputValidation.isValidNumericAnswer(a.AdditionalText))
                        {
                            isAnyInvalidAccountValue = true;
                            a.set("IsInvalid", true)
                        }
                    });
                    if (isAnyInvalidAccountValue)
                    {
                        self.validationErrorMessage += "The Account values can contain only numeric characters."
                    }
                };
                SurveyResponseViewModelNew.prototype.OnSingleSelectionChanged = function(e)
                {
                    var qr = e.data;
                    this.SetSelectionForQuestion(qr.SelectedValue, qr);
                    if (this.surveyInfo.isInitialSurvey())
                    {
                        if (qr.Question && qr.Question.IsAccountQuestion())
                        {
                            amplify.publish("InitialSurvey.AccountChange", {
                                questionResponseId: qr.SelectedItem.QuestionResponseId, uniqueId: qr.SelectedItem.EntityUniqueId, additionalText: qr.SelectedItem.AdditionalText
                            })
                        }
                    }
                };
                SurveyResponseViewModelNew.prototype.OnTwoOptionsChanged = function(e)
                {
                    var aor = e.data;
                    var qr = _.find(this.responsesNew, function(qr)
                        {
                            return qr.EntityUniqueId === aor.EntityUniqueId
                        });
                    this.SetSelectionForQuestion(aor.AnswerOption.Id, qr)
                };
                SurveyResponseViewModelNew.prototype.OnCheckboxOptionsChanged = function(e)
                {
                    var aor = e.data;
                    (aor).set("IsTextResponseRequiredFlag", aor.IsSelected && aor.AnswerOption.IsTextResponseRequired);
                    if (!aor.IsSelected && aor.AnswerOption.IsTextResponseRequired)
                    {
                        (aor).set("AdditionalText", null)
                    }
                };
                SurveyResponseViewModelNew.prototype.EnforceMaxlength = function(e)
                {
                    if (Fi.Utils.InputValidation.isCtrlActionPaste(e))
                    {
                        setTimeout(function()
                        {
                            Fi.Utils.InputValidation.EnforceTextLimit(e)
                        }, 20)
                    }
                };
                SurveyResponseViewModelNew.prototype.OnAdditionalTextChanged = function(e)
                {
                    var aor = e.data;
                    if (this.surveyInfo.isInitialSurvey())
                    {
                        if (aor.Question.QuestionText.indexOf("Account") >= 0)
                        {
                            amplify.publish("InitialSurvey.AccountChange", {
                                questionResponseId: aor.SelectedItem.QuestionResponseId, uniqueId: aor.SelectedItem.EntityUniqueId, additionalText: aor.SelectedItem.AdditionalText
                            })
                        }
                    }
                };
                SurveyResponseViewModelNew.prototype.SetSelectionForQuestion = function(selectedId, forQuestionResponse)
                {
                    var selectedAnswer;
                    _.each(forQuestionResponse.Answers, function(answer)
                    {
                        if (answer.AnswerOption.Id === selectedId)
                        {
                            answer.IsSelected = true;
                            selectedAnswer = answer
                        }
                        else
                        {
                            if (answer.IsSelected == true)
                            {
                                answer.IsSelected = false
                            }
                        }
                    });
                    this.setSelectedItem(forQuestionResponse, selectedAnswer)
                };
                SurveyResponseViewModelNew.prototype.setSelectedItem = function(qr, selected)
                {
                    (qr).set("SelectedItem", selected)
                };
                SurveyResponseViewModelNew.prototype.CloseMessage = function(e)
                {
                    (this.userMessage).set("IsVisible", false)
                };
                SurveyResponseViewModelNew.prototype.ShowSuccess = function(text)
                {
                    var message = Fi.Utils.UserMessage.Info(text);
                    this.ShowMessage(message)
                };
                SurveyResponseViewModelNew.prototype.ShowWarning = function(text)
                {
                    var message = Fi.Utils.UserMessage.Warning(text);
                    this.ShowMessage(message)
                };
                SurveyResponseViewModelNew.prototype.ShowError = function(text)
                {
                    var message = Fi.Utils.UserMessage.Error(text);
                    this.ShowMessage(message, 0)
                };
                SurveyResponseViewModelNew.prototype.ShowMessage = function(message, displayForMiliseconds)
                {
                    if (typeof displayForMiliseconds === "undefined")
                    {
                        displayForMiliseconds = 8000
                    }
                    var observableMessage = kendo.observable(message);
                    ((this)).set("userMessage", observableMessage);
                    if (displayForMiliseconds > 0)
                    {
                        setTimeout(function()
                        {
                            observableMessage.set("IsVisible", false)
                        }, displayForMiliseconds)
                    }
                };
                return SurveyResponseViewModelNew
            })();
        Survey.SurveyResponseViewModelNew = SurveyResponseViewModelNew;
        var SurveyResponseControllerNew = (function()
            {
                function SurveyResponseControllerNew(surveyId, surveyResponseId, organizationUrl, userId, isDisabled, contactId, surveyName)
                {
                    this.surveyId = surveyId;
                    this.surveyResponseId = surveyResponseId;
                    this.organizationUrl = organizationUrl;
                    this.isDisabled = isDisabled;
                    this.userId = userId;
                    this.contactId = contactId;
                    this.surveyName = surveyName;
                    this.additionalInfo = new AdditionalInfo(contactId, "", "", "");
                    this.surveyInfo = null
                }
                ;
                var surveyIDs = {
                        initialReviewSurveyId: 27, nineQuestionSurveyId: 114, custodianSurveyId: 29
                    };
                var AdditionalInfo = function(contactId, clientLastName, lastNameICAssigned, networkId)
                    {
                        this.contactId = contactId;
                        this.clientLastName = clientLastName;
                        this.lastNameICAssigned = lastNameICAssigned;
                        this.networkId = networkId
                    };
                var SurveyModel = function(surveyId, fi_name, fi_id, fi_isdisabledonedit, fi_only1percustomer)
                    {
                        var id = surveyId,
                            name = fi_name,
                            fi_id = fi_id,
                            isdisabledonedit = fi_isdisabledonedit,
                            only1percustomer = fi_only1percustomer;
                        this.additionalInfo = {};
                        this.isInitialSurvey = function()
                        {
                            return fi_id == surveyIDs.initialReviewSurveyId
                        };
                        this.isTest = function()
                        {
                            return name == "Test"
                        };
                        this.isNineQuestionSurvey = function()
                        {
                            return fi_id == surveyIDs.nineQuestionSurveyId
                        };
                        this.isCustodianSurvey = function()
                        {
                            return fi_id == surveyIDs.custodianSurveyId
                        };
                        this.isDisableOnEdit = function()
                        {
                            return isdisabledonedit != undefined && isdisabledonedit != null && isdisabledonedit == true
                        };
                        this.isOnlyOnePerCustomer = function()
                        {
                            return only1percustomer != undefined && only1percustomer != null && only1percustomer == true
                        }
                    };
                SurveyResponseControllerNew.prototype.GetSurveyResponseId = function()
                {
                    if (this.viewModelNew.responsesNew && this.viewModelNew.responsesNew.length > 0)
                    {
                        this.surveyResponseId = this.viewModelNew.responsesNew[0].SurveyResponseId
                    }
                    ;
                    return this.surveyResponseId
                };
                SurveyResponseControllerNew.prototype.SaveSurveyResponse = function(onCompletion)
                {
                    if (this.viewModelNew && !this.isDisabled)
                    {
                        this.viewModelNew.SaveSurveyResponse(onCompletion)
                    }
                };
                SurveyResponseControllerNew.prototype.SaveQuestionResponses = function(onCompletion)
                {
                    if (this.viewModelNew && !this.isDisabled)
                    {
                        this.viewModelNew.SaveQuestionResponses(onCompletion)
                    }
                };
                SurveyResponseControllerNew.prototype.BindViewModelAndLoadDataNew = function(isFirstLoad, isCreate)
                {
                    var _this = this;
                    this.LoadSurveyInfo(isCreate, function()
                    {
                        _this.BindViewModelNew();
                        _this.viewModelNew.LoadResponses(isFirstLoad, isCreate)
                    })
                };
                SurveyResponseControllerNew.prototype.BindViewModelNew = function()
                {
                    this.SetDatePickerCustomBinding(kendo);
                    this.SetReadonlyCustomBinding(kendo);
                    var container = $('#surveyBody');
                    if (!container.length)
                    {
                        throw new Error;
                    }
                    if (this.surveyInfo.isNineQuestionSurvey())
                    {
                        this.surveyInfo.additionalInfo = this.additionalInfo
                    }
                    var surveyService = new Fi.Survey.SurveyServiceNew(this.organizationUrl, this.surveyId, this.surveyResponseId, this.contactId, this.surveyName);
                    var viewModel = new SurveyResponseViewModelNew(this.isDisabled, surveyService, this.surveyInfo);
                    this.viewModelNew = kendo.observable(viewModel);
                    kendo.bind(container, this.viewModelNew);
                    this.LoadAndSetUserFormats()
                };
                SurveyResponseControllerNew.prototype.LoadAndSetUserFormats = function()
                {
                    var _this = this,
                        user = new Fi.Services.UserService(this.organizationUrl, this.userId),
                        onSuccess = function(data)
                        {
                            kendo.culture(data.UserCulture);
                            _this.setObservableProperty("DateFormat", data.DateFormat)
                        },
                        onError = function(error)
                        {
                            return _this.OnGetCultureError("User Service - Get culture ", error)
                        };
                    user.GetUserCulture(onSuccess, onError)
                };
                SurveyResponseControllerNew.prototype.LoadAdditionalData = function(callback)
                {
                    var _this = this,
                        user = new Fi.Services.UserService(this.organizationUrl, this.userId),
                        onSuccessGetUserData = function(data)
                        {
                            _this.additionalInfo.networkId = data;
                            _this.GetContactData(callback)
                        },
                        onErrorGetUserData = function(error)
                        {
                            return _this.OnGetUserDataError("User Service - Get user data ", error)
                        };
                    user.GetUserData(onSuccessGetUserData, onErrorGetUserData)
                };
                SurveyResponseControllerNew.prototype.GetContactData = function(callback)
                {
                    var _this = this,
                        user = new Fi.Services.UserService(this.organizationUrl, this.userId),
                        onSuccessGetContactData = function(data)
                        {
                            _this.additionalInfo.clientLastName = data.clientLastName;
                            _this.additionalInfo.lastNameICAssigned = data.lastNameICAssigned;
                            _this.additionalInfo.contactId = data.contactId;
                            if (callback != undefined)
                            {
                                callback()
                            }
                        },
                        onErrorGetContactData = function(error)
                        {
                            return _this.OnGetUserDataError("User Service - Get contact data ", error)
                        };
                    user.GetContactData(_this.contactId, onSuccessGetContactData, onErrorGetContactData)
                };
                SurveyResponseControllerNew.prototype.LoadSurveyInfo = function(isCreate, callback)
                {
                    var _this = this,
                        surveyService = new Fi.Survey.SurveyServiceNew(this.organizationUrl, this.surveyId, this.surveyResponseId, this.contactId, this.surveyName),
                        onSuccess = function(result)
                        {
                            _this.surveyInfo = new SurveyModel(_this.surveyId, result.d.fi_name, result.d.fi_id_search, result.d.fi_isdisabledonedit, result.d.fi_only1percustomer);
                            if (!isCreate)
                            {
                                var isDisabledOnEdit = _this.surveyInfo.isDisableOnEdit();
                                _this.isDisabled = _this.isDisabled || isDisabledOnEdit;
                                if (callback != undefined)
                                {
                                    callback()
                                }
                            }
                            ;
                            if (isCreate)
                            {
                                if (_this.surveyInfo.isOnlyOnePerCustomer())
                                {
                                    _this.CheckDuplicateSurveyResponse(callback)
                                }
                                else if (_this.surveyInfo.isNineQuestionSurvey())
                                {
                                    _this.LoadAdditionalData(callback)
                                }
                                else
                                {
                                    if (callback != undefined)
                                    {
                                        callback()
                                    }
                                }
                            }
                            ;
                        },
                        onError = function(error)
                        {
                            return _this.OnGetSurveyInfoError("Survey Service - Get survey info ", error)
                        };
                    surveyService.GetSurveyInfo(onSuccess, onError)
                };
                SurveyResponseControllerNew.prototype.CheckDuplicateSurveyResponse = function(callback)
                {
                    var _this = this,
                        surveyService = surveyService = new Fi.Survey.SurveyServiceNew(this.organizationUrl, this.surveyId, this.surveyResponseId, this.contactId, this.surveyName),
                        onSuccess = function(result)
                        {
                            if (result && result.length > 0)
                            {
                                _this.isDisabled = true;
                                _this.surveyResponseId = result[0].fi_surveyresponseId;
                                alert("This survey already exists for this contact. Only one instance is allowed.")
                            }
                            if (callback != undefined)
                            {
                                callback()
                            }
                        },
                        onError = function(error)
                        {
                            return _this.OnGetSurveyInfoError("Survey Service - Get duplicate survey responses ", error)
                        };
                    surveyService.CheckDuplicateSurveyResponse(onSuccess, onError)
                };
                SurveyResponseControllerNew.prototype.setObservableProperty = function(property, value)
                {
                    (((this.viewModelNew))).set(property, value)
                };
                SurveyResponseControllerNew.prototype.OnGetCultureError = function(message, error)
                {
                    kendo.culture("en-US");
                    this.viewModelNew.ShowError(message + " Error: " + error.message)
                };
                SurveyResponseControllerNew.prototype.OnGetUserDataError = function(message, error)
                {
                    if (this.viewModelNew)
                    {
                        this.viewModelNew.ShowError(message + " Error: " + error.message)
                    }
                    else
                    {
                        alert(error.message)
                    }
                };
                SurveyResponseControllerNew.prototype.OnGetSurveyInfoError = function(message, error)
                {
                    if (this.viewModelNew)
                    {
                        this.viewModelNew.ShowError(message + " Error: " + error.message)
                    }
                    else
                    {
                        alert(error.message)
                    }
                };
                SurveyResponseControllerNew.prototype.SetDatePickerCustomBinding = function(kendo)
                {
                    kendo.data.binders.widget.dateFormat = kendo.data.Binder.extend({
                        init: function(widget, bindings, options)
                        {
                            options.format = bindings.value.parents[1].DateFormat;
                            kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options)
                        }, refresh: function(){}
                    })
                };
                SurveyResponseControllerNew.prototype.SetReadonlyCustomBinding = function(kendo)
                {
                    kendo.data.binders.readonly = kendo.data.Binder.extend({refresh: function()
                        {
                            var value = this.bindings["readonly"].get();
                            if (value)
                            {
                                $(this.element).prop("readonly", true)
                            }
                            else
                            {
                                $(this.element).prop("readonly", false)
                            }
                        }})
                };
                return SurveyResponseControllerNew
            })();
        Survey.SurveyResponseControllerNew = SurveyResponseControllerNew
    })(Fi.Survey || (Fi.Survey = {}));
    var Survey = Fi.Survey
})(Fi || (Fi = {}))
