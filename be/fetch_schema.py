import urllib.request

urls = [
    "https://sso.arnatech.id/swagger.json",
    "https://sso.arnatech.id/api/swagger.json",
    "https://sso.arnatech.id/redoc/?format=openapi",
    "https://sso.arnatech.id/swagger/?format=openapi",
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        if len(html) > 100:
            with open('schema.json', 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"Success with URL: {url}")
            break
    except Exception as e:
        print(f"Failed {url}: {e}")
