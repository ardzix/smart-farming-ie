import json

def get_mfa_details():
    with open('schema.json', 'r', encoding='utf-8') as f:
        schema = json.load(f)
    
    paths = schema.get('paths', {})
    
    print("=== LOGIN ENDPOINTS ===")
    for path, methods in paths.items():
        if 'login' in path.lower():
            print(f"\nPath: {path}")
            for method, spec in methods.items():
                if isinstance(spec, dict):
                    print(f"[{method.upper()}]")
                    responses = spec.get('responses', {})
                    for status, detail in responses.items():
                        desc = detail.get('description', '') if isinstance(detail, dict) else str(detail)
                        print(f"  - {status}: {desc}")

    print("\n=== MFA ENDPOINTS ===")
    for path, methods in paths.items():
        if 'mfa' in path.lower():
            print(f"\nPath: {path}")
            for method, spec in methods.items():
                if isinstance(spec, dict):
                    print(f"[{method.upper()}] Operation ID: {spec.get('operationId')}")
                    if 'parameters' in spec:
                        print("  Parameters: Yes")
                    if 'requestBody' in spec:
                        print("  requestBody: Yes")

get_mfa_details()
