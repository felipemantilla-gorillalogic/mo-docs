1. create repo 
2. install 


```bash
npm install @actions/core@ @actions/github @anthropic-ai/sdk esbuild
```


3. cxreate index file with a main funcion 

4. create the action.yml 

5. update scripts on package.json

```cmd
 "scripts": {
    "build": "esbuild src/index.js --bundle --platform=node --target=node20 --outfile=dist/index.js",
    "pub": "npm run build && git add . && mo-commit -S && git push"
  },
```
