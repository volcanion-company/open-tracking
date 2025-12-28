using VolcanionTracking.Api.Models.Enums;

namespace VolcanionTracking.Api.Extensions;

public static class EventTypeExtensions
{
    public static EventGroup GetGroup(this EventType type)
    {
        return type switch
        {
            EventType.API_REQUEST or EventType.API_RESPONSE or EventType.API_ERROR => EventGroup.Api,
            EventType.ERROR_THROWN or EventType.SYSTEM_ALERT => EventGroup.Error,
            EventType.SESSION_START or EventType.SESSION_END => EventGroup.Session,
            EventType.PAGE_VIEW or EventType.SCREEN_VIEW or EventType.ACTION => EventGroup.View,
            EventType.USER_REGISTER or EventType.USER_LOGIN => EventGroup.User,
            _ => EventGroup.System
        };
    }
}
