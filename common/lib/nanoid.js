/// <reference path="./nanoid.d.ts" />
// nanoid is licensed under the MIT License, Copyright 2017 Andrey Sitnik <andrey@sitnik.es>, https://github.com/ai/nanoid/blob/main/LICENSE
let a="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";export let nanoid=(e=21)=>{let t="",r=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=a[63&r[e]];return t};