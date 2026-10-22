import os

def resolve_source(kind, source):
    if kind in ('mp4', 'rtsp'):
        if kind == 'rtsp' and not source.startswith(('rtsp://', 'rtsps://')):
            raise ValueError('RTSP requer URL rtsp:// ou rtsps://')
        return source
    if kind == 'onvif':
        from onvif import ONVIFCamera
        # Device credentials stay local and are never sent to the dashboard.
        camera = ONVIFCamera(os.environ['ONVIF_HOST'], int(os.getenv('ONVIF_PORT', '80')),
                             os.environ['ONVIF_USER'], os.environ['ONVIF_PASSWORD'])
        media = camera.create_media_service()
        profile = media.GetProfiles()[0]
        uri = media.GetStreamUri({'StreamSetup': {'Stream': 'RTP-Unicast', 'Transport': {'Protocol': 'RTSP'}}, 'ProfileToken': profile.token}).Uri
        # Some devices return a URI without credentials. Configure RTSP_URL locally
        # in that case; do not expose or log the URI.
        return os.getenv('RTSP_URL', uri)
    raise ValueError('Fonte desconhecida')
