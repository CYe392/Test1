var Fi;
(function (Fi) {
    (function (Services) {
        var CultureCode = (function () {
            function CultureCode() {
            }
            CultureCode.GreatBritain = "2057";
            return CultureCode;
        })();

        var UserService = (function () {
            function UserService(serverUrl, userId) {
                this.service = new Fi.Crm.Service(serverUrl);
                this.userId = userId;
            }
            UserService.prototype.GetUserCulture = function (onDataRetrieved, onError) {
                var _this = this;
                var getUser = new Fi.Crm.Request("UserSettings", function (data) {
                    return _this.OnUserSettingsRetreived(data, onDataRetrieved);
                }, onError);
                var query = "$select=LocaleId,DateFormatString";
                this.service.Retrieve(getUser, this.userId, query);
            };

            UserService.prototype.GetUserData = function (onDataRetrieved, onError) {
                var _this = this;
                var getUser = new Fi.Crm.Request("SystemUser", function (data) {
                    return _this.OnUserDataRetreived(data, onDataRetrieved);
                }, onError);
                var query = "$select=fi_Id";
                this.service.Retrieve(getUser, this.userId, query);
            };

            UserService.prototype.GetContactData = function (id, onDataRetrieved, onError) {
                var _this = this;
                var getContact = new Fi.Crm.Request("Contact", function (data) {
                    return _this.OnContactDataRetreived(data, onDataRetrieved);
                }, onError);
                var query = "$select=fi_ICUserId,fi_Id,LastName,fi_systemuser_contact_ICUserId/FullName&$expand=fi_systemuser_contact_ICUserId";
                this.service.Retrieve(getContact, id, query);
            };

            UserService.prototype.OnUserSettingsRetreived = function (data, onDataRetrieved) {
                var userCulture = this.ConvertFromUserCultureCodeToValue(data.d.LocaleId.toString());
                var dateFormat = data.d.DateFormatString;
                var result = { Id: data.d.Id, UserCulture: userCulture, DateFormat: dateFormat };
                onDataRetrieved(result);
            };

            UserService.prototype.OnUserDataRetreived = function (data, onDataRetrieved) {
                var userNetworkId = data.d.fi_Id.toString();
                onDataRetrieved(userNetworkId);
            };

            UserService.prototype.OnContactDataRetreived = function (data, onDataRetrieved) {
                var returnData = { clientLastName: "", lastNameICAssigned: "", contactId: "" };
                if (data && data.d) {
                    returnData.clientLastName = data.d.LastName;
                    returnData.lastNameICAssigned = data.d.fi_ICUserId.Name;
                    returnData.contactId = data.d.fi_Id;
                }
                onDataRetrieved(returnData);
            };

            UserService.prototype.ConvertFromUserCultureCodeToValue = function (format) {
                switch (format) {
                    case CultureCode.GreatBritain:
                        return "en-GB";
                    default:
                        return "en-US";
                }
            };
            return UserService;
        })();
        Services.UserService = UserService;
    })(Fi.Services || (Fi.Services = {}));
    var Services = Fi.Services;
})(Fi || (Fi = {}));
