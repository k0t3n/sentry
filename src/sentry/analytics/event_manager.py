__all__ = ("default_manager", "EventManager")

from sentry.analytics.event import Event


class EventManager:
    def __init__(self):
        self._event_types = {}

    def register(self, event_cls: Event) -> None:
        event_type = event_cls.type
        if event_type in self._event_types:
            assert self._event_types[event_type] == event_cls
        else:
            self._event_types[event_type] = event_cls

    def get(self, type: str) -> Event:
        return self._event_types[type]


default_manager = EventManager()
