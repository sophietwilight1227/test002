<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, type Ref } from 'vue';
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
                  isMaster: boolean,
                  imageList: Array<string>}> = reactive([])
const masterData: Array<{
                  num: string, 
                  name: string, 
                  date: string,
                  mail: string,
                  content: string,
                  id: string,
                  threadTitle: string,
                  isMaster: boolean,
                  imageList: Array<string>,
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
const rawUrl: Ref<string> = ref("https://jbbs.shitaraba.net/bbs/read.cgi/internet/26196/1716204057/")
const rawMessage: Ref<string> = ref("")
const threadTitle: Ref<string> = ref("");
const isLoaded: Ref<boolean> = ref(false);
const isMasterMode: Ref<boolean> = ref(false);
const MasterToggleElem: any = ref(null);
const refSpanElem: any = ref(null);
const responseList: Map<string, any> = reactive(new Map());
const isLoading: Ref<boolean> = ref(false);
const responseCount: Ref<number> = ref(0);

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
  //return "http://127.0.0.1:8787/"
  return "https://test003-ecqh.onrender.com/?url1=" + text[text.length - 4] + "&url2=" + text[text.length - 3] + "&url3=" + text[text.length - 2] ;
  //return "https://sophietwilight1227.github.io/https://jbbs.shitaraba.net/bbs/rawmode.cgi/" + text[text.length - 4] + "/" + text[text.length - 3] + "/" + text[text.length - 2] + "/"
}

const getData = async () => {
  const isProduction = import.meta.env.MODE === "production";
  isLoading.value = true;
  const url = getUrl();
  try {
    const response = await fetch(url, {
                            mode: 'cors',
                            method: "GET",
                          });
    if (!response.ok) {
      throw new Error(`レスポンスステータス : ${response.status}`);
    }
    const content = await response.text()
    const isMaster = localStorage.getItem("zenresu_master_mode");
    if(isMaster == null){
      isMasterMode.value = false;
    }else{
      isMasterMode.value = (isMaster == "true")
    }
    localStorage.setItem("zenresu_last_visit", rawUrl.value);
    MasterToggleElem.value.isActive = isMasterMode.value;
    if(isMasterMode.value){
      masterData.splice(0,);
      setTextForMaster(content) 
    }else{
      data.splice(0)
      setText(content) 
    }
    isLoading.value = false;
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
    responseCount.value = Math.round(resInfo.length / 7);
    for(let i=0; i < (resInfo.length - 1) / 7; i++){
      const content = resInfo[i * 7 + 4];
      const info = {num:resInfo[i * 7 + 0],
                    name: resInfo[i * 7 + 1], 
                    mail: resInfo[i * 7 + 2],
                    date: resInfo[i * 7 + 3],
                    content: content,
                    id: resInfo[i * 7 + 6],
                    threadTitle: resInfo[i * 7 + 5],
                    isMaster: false,
                    imageList: getImageList(content),
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
          data[i].content = deleteEmptyRow(result.raw);
          for(let j=0; j < result.messages.length; j++){
            const cont = {num: "", name: "", date: "", mail: "", id: "", threadTitle: "", content: result.messages[j], isMaster: true, imageList: []}
            data.splice(i+j+1, 0, cont);
          }
        }        
      }
    }
  }
}
const deleteEmptyRow = (str: string): string => {
  const text = str.split("<br>");
  let result = "";
  for(let i=0; i < text.length; i++){
    const res = text[i].trim();
    if(res != ""){
      result += text[i] + "\n";
    }
  }
  return result;
}
const getImageList = (str: string): Array<string> => {
  let result: Array<string> = [];
  const text = str.split("ttp")
  for(let i=0; i < text.length; i++){
    const matchListJpeg = text[i].match(/.+jpeg/g);
    const matchListJpg = text[i].match(/.+jpg/g);
    const matchListPng = text[i].match(/.+png/g);
    result = addImageList(result, matchListJpeg);
    result = addImageList(result, matchListJpg);
    result = addImageList(result, matchListPng);        
  }
  return result
}
const addImageList = (list: Array<string>, matchList: RegExpMatchArray | null) => {
  if(matchList != null){
    for(let i=0; i < matchList.length; i++){
      list.push("http" + matchList[i])
    }
  }
  return list
}

//日本語の文章かどうかの判定。日本語が4文字以上ならtrue(日本語である)
const ja2Bit = ( str: string ): boolean => {
  return ( str.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]{4}/) )? true : false
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
      }else if(ja2Bit(text[i])){
        messages[messages.length-1] += ("\n" + text[i]);
        str = str.replace(text[i], "");
      }
    }
    
  }
  return {raw: str, messages: messages}
}


const setTextForMaster = (raw: string| null) => {
  const JUDGE_NUM = 2; //この数以上のアンカーを持つレスを主のレスとみなす
  masterData.splice(0);
  if(raw != null){
    //const responseList: Map<string, any> = new Map();
    const text = raw.split("<>").join("\n");
    const resInfo = text.split("\n");
    responseCount.value = Math.round(resInfo.length / 7);
    for(let i=0; i < (resInfo.length - 1) / 7; i++){
      const content = resInfo[i * 7 + 4];
      //const content ="test";
      const info = {num:resInfo[i * 7 + 0],
                    name: resInfo[i * 7 + 1], 
                    mail: resInfo[i * 7 + 2],
                    date: resInfo[i * 7 + 3],
                    content: content,
                    id: resInfo[i * 7 + 6],
                    threadTitle: resInfo[i * 7 + 5],
                    isMaster: false,
                    imageList: getImageList(content),
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
          masterData[i].content = deleteEmptyRow(result.raw);
          for(let j=0; j < result.messages.length; j++){
            const cont = {num: "", name: "", date: "", mail: "", id: "", threadTitle: "", content: result.messages[j], isMaster: true, response: ""}
            const arrRes = getResponseNumber(cont.content);
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
                    imageList: [],
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
      const from:number = Number.parseInt(numbers[0]);
      const to:number = Number.parseInt(numbers[1]);
      const result = []
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

onMounted(() => {
  const url = localStorage.getItem("zenresu_last_visit");
  if(url != null && url != ""){
    rawUrl.value = url;
    getData();
  }
})

</script>

<template>
  <div class="loaderBase" v-show="isLoading">
    <div class="loadText">Loading...</div>
    <div class="loader"></div>
  </div>
  
  <div class="base2" >
    <div class="header">
      <span>{{ threadTitle + " / " + responseCount + "レス　　" }}</span>
      <input type="text" v-model="rawUrl">
      <button v-on:click="getData">表示</button>   
      <span>マスターモード</span>
      <ToggleButton v-on:click="changeMasterMode" ref="MasterToggleElem"></ToggleButton>       
    </div>
    <div v-if="!isLoaded">
      <div>読み込むスレを指定してください </div> 
    </div>
    <div v-if="isLoaded" class="base">
      <div class="base" v-if="!isMasterMode" >
      <div v-for="info in data" v-bind:class="{'frame': !info.isMaster}" > 
        <div v-bind:class="{'master': info.isMaster}" class="node">
          <span>{{ info.num }}</span>
          <span>{{ info.name }}</span>
          <span>{{ info.date }}</span>
          <span>{{ info.id }}</span>
          <div class="asciiArt" v-html="info.content"></div>
          <div v-for="img in info.imageList">
            <a :href="img" target="_blank" >
              <img :src="img" :alt="img" loading="lazy"/>               
            </a>
          </div>
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
              <div v-for="img in info.imageList">
                <a :href="img" target="_blank" >
                  <img :src="img" :alt="img" loading="lazy"/>               
                </a>
              </div>          
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
                <div v-if="!child.isMaster && responseList.has(child.num)" class="node">
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
          <button v-on:click="windowOpen">書き込みは元ページから(別窓で開きます)</button> 
        </div>
        <textarea class="textArea asciiArt" v-model="rawMessage"></textarea>
        <div>ここの内容がクリップボードにコピーされます</div>
        <span ref="refSpanElem"></span>
      </div>
    </div>    
  </div>

</template>

<style scoped>
.loadText {
  color: white;
  margin: 0 auto;
}
.loaderBase {
  position: absolute;
  background-color: skyblue;
  width: 100%;
  height: 100%;
  z-index: 1000;
}
.loader,
.loader:before,
.loader:after {
  background: #ffffff;
  -webkit-animation: load1 1s infinite ease-in-out;
  animation: load1 1s infinite ease-in-out;
  width: 1em;
  height: 4em;
}
.loader {
  color: #ffffff;
  text-indent: -9999em;
  margin: 88px auto;
  position: relative;
  font-size: 11px;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
.loader:before,
.loader:after {
  position: absolute;
  top: 0;
  content: '';
}
.loader:before {
  left: -1.5em;
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.loader:after {
  left: 1.5em;
}
@-webkit-keyframes load1 {
  0%,
  80%,
  100% {
    box-shadow: 0 0;
    height: 4em;
  }
  40% {
    box-shadow: 0 -2em;
    height: 5em;
  }
}
@keyframes load1 {
  0%,
  80%,
  100% {
    box-shadow: 0 0;
    height: 4em;
  }
  40% {
    box-shadow: 0 -2em;
    height: 5em;
  }
}

img {
  object-fit: cover;
  height: 100px;
}

.base {
  background-color: skyblue;
  flex: 1;
  overflow: auto;
}
.base2 {
  display: flex;
  flex-direction: column;  
  max-height: 95vh;
    width: fit-content;
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
