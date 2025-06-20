import { readFile, writeFile } from 'fs/promises';
import { createServer } from 'http';
import crypto, { randomBytes } from "crypto";
import path from "path";


const PORT = 3000;
const DATA_FILE = path.join("data","links.json"); 

const serverfile = async(res,filepath,contentType) => {
  try{
      const data = await readFile(filepath);
      res.writeHead(200,{"Content-Type": contentType});
      res.end(data);

    }catch(error){
      res.writeHead(404,{"Content-Type": "text/html"});
      res.end("404 Page Not Found");
    }
}

const loadLinks = async() => {
  try{
    const data = await readFile(DATA_FILE,"utf-8");
    return JSON.parse(data);
  }catch(error){
    if(error.code === "ENOENT"){
      await writeFile(DATA_FILE,JSON.stringify({}));
      return {};
    }
    throw error;
  }
}


const savelinks = async(links) => {
  await writeFile(DATA_FILE,JSON.stringify(links));
}

const server =  createServer(async(req,res)=>{
  if(req.method==="GET"){
    if(req.url==="/"){
      return serverfile(res,path.join("public","index.html"), "text/html");
    }
    else if(req.url==="/style.css"){
      return serverfile(res,path.join("public","style.css"),"text/css");
    }
    else if(req.url==="/links"){
      const links = await loadLinks();
      res.writeHead(200,{"Content-Type":"application/json"});
      return res.end(JSON.stringify(links));  
    }else{
      const links = await loadLinks();
      const shortCode = req.url.slice(1);
      if(links[shortCode]){
        res.writeHead(302,{location:links[shortCode]});
        return res.end();
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Shortcode not found");
    }
  }



  if(req.method === "POST" && req.url==="/shorten"){

    let links = await loadLinks();

    let body = "";
    req.on("data",async(chunks)=>{
      body+=chunks;
    });
    req.on("end",async()=>{
      const {url,shortCode} = JSON.parse(body);
      if(!url){
        res.writeHead(400,{"Content-Type":"text/plain"});
        return res.end("URL is required");
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");  

      if(links[finalShortCode]){
        res.writeHead(409,{"Content-Type":"text/plain"});
        return res.end("Short Code Already Exist. Try Another");
      }
    
      links[finalShortCode]=url;
      await savelinks(links);
    
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({success:true,shortCode:finalShortCode}));
    })
  }
});

server.listen(PORT, ()=>{
  console.log(`Server run on http://localhost:${PORT}`);
});

