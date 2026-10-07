# WebMCP & ChatGPT plugin configuration

## Public descriptors

| URL | Role |
|-----|------|
| `/mcp.json` | Origin VCAP Actionability (MCP-style tools) |
| `/webmcp.json` | WebMCP surfaces + ChatGPT pointers |
| `/.well-known/ai-plugin.json` | ChatGPT plugin manifest |
| `/openapi.json` | Actions / Performability OpenAPI |

## ChatGPT custom GPT / Actions

1. Create a Custom GPT or plugin using **OpenAPI** URL:  
   `https://coloringdictionary.com/openapi.json`
2. Manifest (legacy plugin):  
   `https://coloringdictionary.com/.well-known/ai-plugin.json`
3. Allowed actions (public only): brand, book, seed manifest, signup, VCAP hit.
4. Do **not** expose owner CRM, finance, or unpublished assets via the plugin.

## WebMCP

Agents should discover:

- Visibility: `/`, `/llms.txt`, `/irl/coloring-dictionary`
- Citability: `/brand.json`, `/book.json`, `/json.ld`
- Actionability: `/mcp.json`, `/webmcp.json`
- Performability: `/openapi.json`, `/api/*`

Record hits with `POST /api/vcap/hit` (`surface`, `path`).

## Policy for agents

- Prefer documented seed / brand / book JSON over inventing meanings.
- Preserve license and attribution requirements.
- Consumer personalization (“Build a Coloring Dictionary”) is out of scope for these public tools.
