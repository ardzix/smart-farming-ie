import urllib.request
import re

url = "https://sso.arnatech.id/redoc/"
html = urllib.request.urlopen(url).read().decode('utf-8')

# Exract the spec-url
match = re.search(r'spec-url="([^"]+)"', html)
if match:
    spec_url = match.group(1)
    print(f"Schema URL: {spec_url}")
    # Download the schema
    schema = urllib.request.urlopen(spec_url).read().decode('utf-8')
    with open('schema.json', 'w', encoding='utf-8') as f:
        f.write(schema)
    print("Schema saved to schema.json")
else:
    print("Could not find spec-url")
    print(html[:500])
