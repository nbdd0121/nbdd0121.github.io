function encodeHtml(str){
  var s="";
  if(str.length == 0)
    return "";
  s=str.replace(/&/g, "&amp;");
  s=s.replace(/</g, "&lt;");
  s=s.replace(/>/g, "&gt;");
  s=s.replace(/ /g, "&nbsp;");
  s=s.replace(/\'/g, "&#39;");
  s=s.replace(/\"/g, "&quot;");
  s=s.replace(/\n/g, "<br>");
  return s;
}

String.prototype.common=function common(str){
  var len=Math.min(this.length, str.length);
  for(var i=0; i < len; i++){
    if(str[i] != this[i]){
      return str.substr(0, i);
    }
  }
  return str.substr(0, len);
}
