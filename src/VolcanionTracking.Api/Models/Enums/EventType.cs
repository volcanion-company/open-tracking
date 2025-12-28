using System.ComponentModel;

namespace VolcanionTracking.Api.Models.Enums;

public enum EventType
{
    [Description("API Request")]
    API_REQUEST = 100000,
    [Description("API Response")]
    API_RESPONSE = 100001,
    [Description("API Error")]
    API_ERROR = 100002,

    [Description("Error Thrown")]
    ERROR_THROWN = 200000,
    [Description("System Alert")]
    SYSTEM_ALERT = 210000,

    [Description("User Registered")]
    USER_REGISTER = 600000,
    [Description("User Logged In")]
    USER_LOGIN = 600001,

    [Description("Session Started")]
    SESSION_START = 400000,
    [Description("Session Ended")]
    SESSION_END = 400001,

    [Description("Page View")]
    PAGE_VIEW = 300000,
    [Description("Screen View")]
    SCREEN_VIEW = 300001,
    [Description("User Action")]
    ACTION = 300002,
}
