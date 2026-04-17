import json

def get_param_schema():
    with open('schema.json', 'r', encoding='utf-8') as f:
        schema = json.load(f)
    
    paths = schema.get('paths', {})
    endpoints = ['/auth/mfa/status/', '/auth/mfa/set/', '/auth/mfa/verify/', '/auth/login/']
    
    for ep in endpoints:
        print(f"=== {ep} ===")
        methods = paths.get(ep, {})
        for method, spec in methods.items():
            if isinstance(spec, dict):
                print(f"[{method.upper()}]")
                for param in spec.get('parameters', []):
                    if param.get('in') == 'body':
                        print(f"  Body details: {json.dumps(param.get('schema', {}), indent=2)}")
                    else:
                        print(f"  Param `{param.get('name')}` in {param.get('in')}")
                
               # for responses check the schema
                responses = spec.get('responses', {})
                for status, res in responses.items():
                    print(f"  -> {status}: {json.dumps(res.get('schema', {}), indent=2)}")
        print()

get_param_schema()
