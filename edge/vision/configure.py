"""Interactive local setup. Never prints RTSP credentials or API keys."""
import getpass
import json
import os
from pathlib import Path

def main():
    print('Restaurant Vision AI — configuração no estabelecimento')
    package = Path(input('Caminho do pacote edge-*.json baixado do aplicativo: ').strip().strip('"'))
    config = json.loads(package.read_text(encoding='utf-8-sig'))
    from urllib.parse import urlparse
    url = urlparse(config['platformUrl'])
    if url.scheme != 'https' or not url.netloc:
        raise ValueError('O pacote deve usar HTTPS. Baixe-o do seu aplicativo autenticado.')
    print('O pacote concede acesso somente à sua unidade. Guarde-o no computador do estabelecimento.')
    source = getpass.getpass('URL RTSP da câmera (entrada oculta; pode conter usuário e senha): ').strip()
    if not source.startswith(('rtsp://', 'rtsps://')):
        raise ValueError('Informe o endereço RTSP fornecido pelo DVR/câmera.')
    values = {'PLATFORM_URL': config['platformUrl'], 'EDGE_API_KEY': config['edgeApiKey'], 'RTSP_URL': source}
    # JSON stores values without shell interpolation and is gitignored.
    target = Path('.edge-config.json')
    target.write_text(json.dumps(values), encoding='utf-8')
    if os.name != 'nt':
        target.chmod(0o600)
    Path('zones.json').write_text(json.dumps({'cameraId': config['cameraId'], 'zones': config['zones']}), encoding='utf-8')
    print('Configuração salva localmente. Inicie com: python -m vision.run --kind rtsp --zones zones.json --live')

if __name__ == '__main__':
    main()
