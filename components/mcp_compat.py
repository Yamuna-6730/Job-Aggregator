"""Runtime compatibility patches for MCP/anyio interop."""
try:
    import anyio
except Exception:
    anyio = None

if anyio is not None and not hasattr(anyio.create_memory_object_stream, "__class_getitem__"):
    def _make_create_mos_subscriptable(fn):
        class _Wrap:
            def __init__(self, f):
                self._orig_f = f

            def __call__(self, *a, **kw):
                return self._orig_f(*a, **kw)

            def __getitem__(self, _):
                # Support instance subscription like `obj[...]`
                return lambda *a, **kw: self._orig_f(*a, **kw)

            @classmethod
            def __class_getitem__(cls, _):
                # Support class-level subscription as well (just in case)
                return lambda *a, **kw: cls._instance._orig_f(*a, **kw)

        _Wrap._instance = _Wrap(fn)
        return _Wrap._instance

    anyio.create_memory_object_stream = _make_create_mos_subscriptable(anyio.create_memory_object_stream)
