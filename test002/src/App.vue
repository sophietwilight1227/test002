<script setup lang="ts">
import { nextTick, reactive, ref, type Ref } from 'vue';
import Encoding from 'encoding-japanese';
import ToggleButton from './component/toggleButton.vue';

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
const masterData: Array<{
                  num: string, 
                  name: string, 
                  date: string,
                  mail: string,
                  content: string,
                  id: string,
                  threadTitle: string,
                  isMaster: boolean,
                  childMessages: Array<{
                    num: string, 
                    name: string, 
                    date: string,
                    mail: string,
                    content: string,
                    id: string,
                    threadTitle: string,
                    isMaster: boolean,
                    response: string,
                  }>}> = reactive([])
const masterList: Array<string> = reactive([]);
const rawUrl: Ref<string> = ref("https://jbbs.shitaraba.net/bbs/read.cgi/internet/26196/1735542868/")
const rawMessage: Ref<string> = ref("vueからの書き込みテストです")
const threadTitle: Ref<string> = ref("");
const isLoaded: Ref<boolean> = ref(false);
const isMasterMode: Ref<boolean> = ref(false);
const MasterToggleElem: any = ref(null);
const refSpanElem: any = ref(null);

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

const changeMasterMode = () => {
  isMasterMode.value = MasterToggleElem.value.isActive;
  localStorage.setItem("zenresu_master_mode", isMasterMode.value.toString());
  getData();
}

const getUrl = () => {
  const text = rawUrl.value.split("/");
  console.log(text);
  //return "http://127.0.0.1:8787/"
  return "https://test003-ecqh.onrender.com/?url1=" + text[text.length - 4] + "&url2=" + text[text.length - 3] + "&url3=" + text[text.length - 2] ;
  //return "https://sophietwilight1227.github.io/https://jbbs.shitaraba.net/bbs/rawmode.cgi/" + text[text.length - 4] + "/" + text[text.length - 3] + "/" + text[text.length - 2] + "/"
}

const getData = async () => {
  const isProduction = import.meta.env.MODE === "production";
  const url = getUrl();
  try {
    const response = await fetch(url, {
                            mode: 'cors',
                            method: "GET",
                          });
    if (!response.ok) {
      console.log(response)
      throw new Error(`レスポンスステータス : ${response.status}`);
    }
    const content = await response.text()
    isMasterMode.value = (localStorage.getItem("zenresu_master_mode") == "true")
    MasterToggleElem.value.isActive = isMasterMode.value;
    if(isMasterMode.value){
      setTextForMaster(content) 
    }else{
      setText(content) 
    }
    
    isLoaded.value = true;
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
      if(info.threadTitle != ""){
        threadTitle.value = info.threadTitle;
      }
      if((info.content.split("&gt;&gt;")).length > 2){
        masterList.push(info.id);
      }
      data.push(info);
    }   
    for(let i=0; i < data.length; i++){
      if(data[i] != undefined){
        if(masterList.includes(data[i].id)){
          data[i].isMaster = true;
          const result = getResponse(data[i].content);
          data[i].content = result.raw;
          for(let j=0; j < result.messages.length; j++){
            const cont = {num: "", name: "", date: "", mail: "", id: "", threadTitle: "", content: result.messages[j], isMaster: true}
            data.splice(i+j+1, 0, cont);
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


const setTextForMaster = (raw: string| null) => {
  const JUDGE_NUM = 2; //この数以上のアンカーを持つレスを主のレスとみなす
  masterData.splice(0);
  if(raw != null){
    const responseList: Map<string, any> = new Map();
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
                    childMessages: [],
      }
      if((info.content.split("&gt;&gt;")).length >= JUDGE_NUM){
        masterList.push(info.id);
      }
      masterData.push(info);
    }   
    for(let i=0; i < masterData.length; i++){
      if(masterData[i] != undefined){
        if(!masterList.includes(masterData[i].id)){
          responseList.set(masterData[i].num, masterData[i]);
        }
      }
    }

    for(let i=0; i < masterData.length; i++){
      if(masterData[i] != undefined){
        if(masterList.includes(masterData[i].id)){
          masterData[i].isMaster = true;
          const result = getResponse(masterData[i].content);
          masterData[i].content = result.raw;
          for(let j=0; j < result.messages.length; j++){
            const cont = {num: "", name: "", date: "", mail: "", id: "", threadTitle: "", content: result.messages[j], isMaster: true, response: ""}
            const arrRes = getResponseNumber(cont.content);
            console.log(arrRes);
            for(let j=0; j < arrRes.length; j++){
              const resNum = arrRes[j];
              if(responseList.has(resNum)){
                masterData[i].childMessages.splice(i+1, 0, responseList.get(resNum));
                responseList.delete(resNum);
              }
              masterData[i].childMessages.splice(i+1, 0, cont);              
            }
          }
        }     
      }
    }
    for(let i=masterData.length-1; i >= 0; i--){
      if(!masterData[i].isMaster){
        masterData.splice(i, 1);
      }
    }
    const info = {num:"",
                    name: "", 
                    mail: "",
                    date: "",
                    content: "",
                    id: "",
                    threadTitle: "",
                    isMaster: true,
                    childMessages: new Array<any>(),
    }
    for(let i=0; i < 1000; i++){
      if(responseList.has(i.toString())){
        const res: any = responseList.get(i.toString());
        if(res != null){
          if(!masterList.includes(res.id)){
            const res: any = responseList.get(i.toString())
            info.childMessages.push(res);            
          }
        }


      }
    }
    masterData.push(info);
  }
  return [];
}

const getResponseNumber = (str: string): Array<string> => {
  const range = str.match(/&gt;&gt;[0-9]+-[0-9]+/g)
  if(range != null && range.length > 0){
    const numbers = range[0].match(/[0-9]+/g);
    if(numbers != null){
      console.log(numbers);
      const from:number = Number.parseInt(numbers[0]);
      const to:number = Number.parseInt(numbers[1]);
      const result = []
      console.log(from, to)
      for(let i=from; i<=to; i++){
        result.push(i.toString());
      }
      return result;      
    }else{
      return []
    }
  }else{
    const res = str.match(/&gt;&gt;[0-9]+/g)
    if(res == null){
      return [];
    }else{
      const result = [];
      console.log(res);
      for(let i=0; i<res.length; i++){
        
        if(res[i].length >= 8){
          result.push(res[i].slice(8))
        }
      }
      return result;
    }    
  }
}

const copyToClipboard = async () => {
  if (!navigator.clipboard) {
    alert("残念。このブラウザは対応していません...");
    return;
  }

  navigator.clipboard.writeText(await getResponseSentense()).then(
    () => {
      alert("クリップボードにレス内容をコピーしました");
    },
    () => {
      alert('コピーに失敗しました');
    });
}

const getResponseSentense = async () => {
  if(isMasterMode.value){
    let response: string = ""
    for(let i=0; i < masterData[masterData.length-1].childMessages.length; i++){
      const num = masterData[masterData.length-1].childMessages[i].num
      const res = masterData[masterData.length-1].childMessages[i].response;
      if(res != null && res != ""){
        response += ">>" + num.toString() + "\n" + res + "\n\n"; 
      }
    }
    const aa = rawMessage.value;
    return await concatAA(aa, response);
  }else{
    return rawMessage.value;
  }
}

const concatAA = async (aa: string, comment: string) => {
  let aaText = aa.split("\n");
  const commentText = comment.split("\n");
  let startRow = 0;
  let endRow = 0;
  if(aaText.length >= commentText.length){
    startRow = Math.floor(aaText.length / 2) - Math.floor(commentText.length / 2);
    endRow = startRow + commentText.length - 1;
  }else{
    for(let i=0; i < commentText.length - aaText.length; i++){
      aa += "\n"
    }
    aaText = aa.split("\n");
    startRow = 0;
    endRow = commentText.length - 1;
  }
  const editAAText = [];
  const editAAWidth = [];
  for(let i=0; i <= endRow - startRow; i++){
    editAAText[i] = aaText[i + startRow];
    editAAWidth[i] = await calcWidth(editAAText[i]);
  }
  const editAA = addSpaceToLineEndToArrange(editAAText, editAAWidth).split("\n");
  let result = "";
  for(let i=0; i < startRow; i++){
    result += aaText[i] + "\n";
  }
  for(let i = 0; i < editAA.length; i++){
    result += editAA[i] + commentText[i] + "\n";
  }
  for(let i=0; i < aaText.length - startRow - editAA.length - 1; i++){
    result += aaText[endRow + 1 + i] + "\n";
  }
  console.log(result)
  return result;
}

const calcWidth = async (text: string) => {
  refSpanElem.value.innerHTML = "text" + text;
  await nextTick();
  //console.log(span, span.offsetWidth, span.innerHTML);
  return refSpanElem.value.offsetWidth;
}

const addSpaceToLineEndToArrange = (aa: Array<string>, widthList: Array<number>) => {
  const aryMax = (a: number,b: number) => {return Math.max(a,b)};
  const maxWidth = widthList.reduce(aryMax);

  //const widthHalf:number = 5; //半角スペースの幅
  //const widthFull: number = 11;   //全角スペースの幅
  for(let i=0; i < widthList.length; i++){
    const widthDiff:number = maxWidth - widthList[i];
    let widthRes: number = widthDiff % 11;
    let countHalf = 10; //全角1個　=> 半角2個 の変換で1dotずれるので、最大10回ずらせばすべてカバーできる
    let countFull = 10 + (widthDiff - widthRes) / 11;
    if(widthRes >= 5){
      widthRes -= 5;
      countHalf ++;
    }
    countHalf -= widthRes * 2;
    countFull += widthRes
    aa[i] += "　".repeat(countFull - countHalf)
    aa[i] += "　 ".repeat(countHalf);
  }
  const aaPlusSpace = aa.join("\n");
  return aaPlusSpace;
}


const windowOpen = () => {
  const test: any = window.open(rawUrl.value);
  test.scrollTo(0, 0);
}

</script>

<template>
  <div class="base2" >
    <div class="header" v-show="isLoaded">
      <span>{{ threadTitle + " / " + data.length + "レス" }}</span>
      <span>マスターモード</span>
      <ToggleButton v-on:click="changeMasterMode" ref="MasterToggleElem"></ToggleButton>
    </div>
    <div v-if="!isLoaded">
      <div>読み込むスレを指定してください </div>
      <input type="text" v-model="rawUrl">
      <button v-on:click="getData">表示</button>    
    </div>
    <div v-if="isLoaded">
      <div class="base" v-if="!isMasterMode" >
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
      <div class="base" v-if="isMasterMode">
        <div v-for="info in masterData" > 
          <div class="frameRow">
            <div class="master node">
              <span>{{ info.num }}</span>
              <span>{{ info.name }}</span>
              <span>{{ info.date }}</span>
              <span>{{ info.id }}</span>
              <div class="asciiArt" v-html="info.content"></div>            
            </div>
            <div class="frameColumn">
              <div v-for="child in info.childMessages" v-bind:class="{'frame': child.isMaster}" >
                <div v-bind:class="{master: !child.isMaster}" class="node">
                  <span>{{ child.num }}</span>
                  <span>{{ child.name }}</span>
                  <span>{{ child.date }}</span>
                  <span>{{ child.id }}</span>
                  <div class="asciiArt" v-html="child.content"></div>
                </div>
                <div v-if="!child.isMaster && info.content==''" class="node">
                  <span>{{ ">>" + child.num.toString() }}</span>
                  <textarea class="textArea" v-model="child.response"></textarea>
                </div>
              </div>            
            </div>
          </div>
        </div>    
      </div>
    </div>
    <div class="footer" v-show="isLoaded">
      <div>
        <div>
          <button v-on:click="copyToClipboard">クリップボードにコピー</button>   
          <button v-on:click="windowOpen">書き込みは元ページから(別窓でを開きます)</button> 
        </div>
        <textarea class="textArea" v-model="rawMessage"></textarea>
        <span ref="refSpanElem"></span>
      </div>
    </div>    
  </div>

</template>

<style scoped>
.base {
  background-color: skyblue;
  flex: 1;
  overflow-y: auto;
  width: 100%;
}
.base2 {
  display: flex;
  flex-direction: column;  
  max-height: 100vh;
  width: 100%;
}
.frame {
  display: flex;
  justify-content: flex-end;
}
.frameRow {
  display: flex;
  flex-direction: row;
}
.frameColumn {
  display: flex;
  flex-direction: column;
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
.textArea {
  field-sizing: content;
  min-width: 150px;
  min-height: min-content;
  white-space: pre;
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
