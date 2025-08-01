<script setup lang="ts">
import { reactive, ref, type Ref } from 'vue';


const result: any = ref("");
const textElem: any = ref(null);
const data: Array<{num: string, 
                  name: string, 
                  date: string,
                  mail: string,
                  content: string,
                  id: string,
                  threadTitle: string,
                  isMaster: boolean}> = reactive([])
const masterList: Array<string> = reactive([]);
const rawUrl: Ref<string> = ref("https://jbbs.shitaraba.net/bbs/read.cgi/internet/26196/1735542868/")

const test = () => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", getUrl());
  xhr.send();
  xhr.responseType = "text";
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const data = xhr.response;
      setText(data);
    } else {
      console.log(`Error: ${xhr.status}`);
    }
  };
}

const  test2 = async () => {
  GetHtml('https://jbbs.shitaraba.net/bbs/rawmode.cgi/internet/26196/1735542868/')
    .then((text) => {
      setText(text)
    });  
}

async function GetHtml(url: string) {
  const promise = fetch(url, {mode: "no-cors"})            // Promiseを返す
  const response = await promise;       // fetch が確定するまで待機
  return response.text();               // Text表現の解析結果を値としてプロミス返す
}

const getUrl = () => {
  const text = rawUrl.value.split("/");
  console.log(text);
  //return "/api/" + text[text.length - 4] + "/" + text[text.length - 3] + "/" + text[text.length - 2] + "/"
  return "https://sophietwilight1227.github.io/https://jbbs.shitaraba.net/bbs/rawmode.cgi/" + text[text.length - 4] + "/" + text[text.length - 3] + "/" + text[text.length - 2] + "/"
}

const getData = async () => {
  const isProduction = import.meta.env.MODE === "production";
  const proxyUrl = isProduction
    ? "https://worker01.nanada0629.workers.dev" // 先ほど発行されたエンドポイント
    : "http://localhost:5173/"; // 開発環境での Cloudflare Workers の（デフォルト）エンドポイント
  //const url = `${proxyUrl}?url=${encodeURIComponent("https://worker01.nanada0629.workers.dev")}`;
  //const url = `${proxyUrl}?url=${"https://jbbs.shitaraba.net/bbs/rawmode.cgi/internet/26196/1735542868/"}`;
  const url = '/api/https://worker01.nanada0629.workers.dev';
  //const url = "https://jbbs.shitaraba.net/bbs/rawmode.cgi/internet/26196/1735542868/";
  //const url = getUrl();
  
  console.log(url);
  try {
    const response = await fetch(url, {
                            mode: 'cors',
                            method: "GET",
                            headers: {
                              "Access-Control-Allow-Headers": "Content-Type",
                              'Access-Control-Allow-Origin': "*",
                              "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
                            }
                          });
    if (!response.ok) {
      console.log(response)
      throw new Error(`レスポンスステータス: ${response.status}`);
    }
    const content = await response.blob()
    //const content = await response.text()
    console.log(content);
    const reader: any = new FileReader();
    reader.onload = () => {
      console.log(reader.result) 
      setText(reader.result) }
    reader.readAsText(content, "euc-jp");
  } catch (error: any) {
    console.error(error.message);
  }
}

const setText = (raw: string| null) => {
  if(raw == null){
    textElem.value.innerHTMl = "test"
  }else{
    const text = raw.split("<>").join("\n");
    const resInfo = text.split("\n");
    for(let i=0; i < (resInfo.length - 1) / 7; i++){
      const info = {num:resInfo[i * 7 + 0],
                    name: resInfo[i * 7 + 1], 
                    mail: resInfo[i * 7 + 2],
                    date: resInfo[i * 7 + 3],
                    content: resInfo[i * 7 + 4],
                    id: resInfo[i * 7 + 6],
                    threadTitle: resInfo[i * 7 + 5],
                    isMaster: false,
      }
      if((info.content.split("&gt;&gt;")).length > 2){
        masterList.push(info.id);
      }
      data.push(info);
    }   
    for(let i=data.length; i >= 0; i--){
      if(data[i] != undefined){
        if(masterList.includes(data[i].id)){
          data[i].isMaster = true;
          const result = getResponse(data[i].content);
          data[i].content = result.raw;
          for(let j=result.messages.length; j >= 0; j--){
            const cont = {num: "", name: "", date: "", mail: "", id: "", threadTitle: "", content: result.messages[j], isMaster: true}
            data.splice(i+1, 0, cont);
          }
        }        
      }

    }
  }

}

const ja2Bit = ( str: string ): boolean => {
  return ( str.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]{5}/) )? true : false
}

const getResponse = (str: string) => {
  const text = str.split("<br>");
  const messages = [];
  for(let i=0; i < text.length; i++){
    const index = text[i].lastIndexOf("<a ");
    if( index >= 0){
      const msg = text[i].slice(index,)
      messages.push(msg)
      str = str.replace(msg, "");
    }else if(messages.length > 0){
      const index = text[i].lastIndexOf("　");
      const msg = text[i].slice(index,)
      //messages[messages.length-1] += ("\n" + msg);
      if(ja2Bit(msg)){
        messages[messages.length-1] += ("\n" + msg);
        str = str.replace(msg, "");
      }
    }
    
  }
  return {raw: str, messages: messages}
}

</script>

<template>
  <div>読み込むスレを指定してください </div>
  <input type="text" v-model="rawUrl">
  <button v-on:click="getData">表示</button>
  <div class="base">
    <div v-for="info in data" v-bind:class="{'frame': !info.isMaster}" > 
      <div v-bind:class="{'master': info.isMaster}" class="node">
        <span>{{ info.num }}</span>
        <span>{{ info.name }}</span>
        <span>{{ info.date }}</span>
        <span>{{ info.id }}</span>
        <div class="asciiArt" v-html="info.content"></div>
      </div>
    </div>    
  </div>

</template>

<style scoped>
.base {
  background-color: skyblue;
}
.frame {
  display: flex;
 justify-content: flex-end;
}
.node {
  margin: 10px;
  padding: 10px;
  border: 0px solid;
  border-radius: 10px;
  max-width: 80vw;
  width: fit-content;
  background-color: darkblue;
  color: white;
}
.master {
  background-color: white;
  color: darkblue
}
.asciiArt {
  white-space: pre;
  z-index: 10;
  font-size:16px;
  font-style: normal;
  font-weight: 400;
  line-height:18px;
  letter-spacing: 0;
  text-shadow: none;
  font-weight:normal;
  font-family:'UnicodeException','Saitamaar', 'ＭＳ Ｐゴシック', 'MS PGothic',  'IPAMonaPGothic' !important;
}

@font-face {
  font-family: 'Saitamaar';
  src: url('@/assets/font/Saitamaar.ttf') format('truetype');
}
@font-face {
  font-family: "UnicodeException";
  src: local("ＭＳ Ｐゴシック");
  unicode-range: U+2225; /* 0-9 */
}
</style>
