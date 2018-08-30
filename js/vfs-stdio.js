(function(VFS){
  var color="colorDefault";
  var encode=true;
  function parseConfigEscape(seq){
    var splits=seq.split(";");
    switch(splits[0]){
      case "0":
        color="colorDefault";
        encode=true;
        break;
      case "1": {
        color="";
        for(var i=1; i<splits.length; i++){
          color+="color"+splits[i]+" ";
        }
        break;
      }
      case "2": {
        color="colorDefault";
        encode=false;
        break;
      }
    }
  }
  function genSingleLineCode(str){
    var seq=str.split("\033[");
    var ret;
    if(seq[0]){
      ret = [document.createElement('span')];
      ret[0].className = color;
      ret[0].innerHTML = encode?encodeHtml(seq[0]):seq[0];
    }else{
      ret = [];
    }
    for(var seqNum=1; seqNum<seq.length; seqNum++){
      var txt=seq[seqNum];
      var realTextBegin=txt.indexOf("m");
      parseConfigEscape(txt.substr(0, realTextBegin));
      var element = document.createElement('span');
      element.className = color;
      element.innerHTML = encode?encodeHtml(txt.substr(realTextBegin+1)):txt.substr(realTextBegin+1);
      ret.push(element);
    }
    return ret;
  }
  function lastP() {
    let ps = document.querySelectorAll('p');
    return ps[ps.length - 1];
  }
  function appendString(str){
    var datas=str.split("\n");
    lastP().append(...genSingleLineCode(datas[0]));
    for(var lineNum=1; lineNum<datas.length; lineNum++){
      var line=datas[lineNum];
      var prevp=lastP();
      if(prevp.textContent=="")
        prevp.innerHTML = "&nbsp;";
      document.body.append(document.createElement('p'));
      lastP().append(...genSingleLineCode(line));
    }
  }
  
  var stdoutFile=VFS.lookup("/dev/stdout", true);
  stdoutFile.type="dev";
  stdoutFile.open=function openStdout(){
    return {
      write:appendString,
      __proto__:VFS.dummyDescProto
    };
  };
  
  var stdinFile=VFS.lookup("/dev/stdin", true);
  stdinFile.type="dev";
  stdinFile.open=function openStdin(){
    return {
      readLine:function readLine(callback, funckey){
        function adjustWidth(input){
          input.style.width = document.body.clientWidth - input.offsetLeft + 'px';
        }
        var input=document.createElement('input');
        input.id = 'inputbox';
        input.className = color;
        input.spellcheck = false;
        lastP().append(input);
        adjustWidth(input);
        input.focus();
        input.addEventListener('keypress', function(e){
          if(e.which==13){
            input.remove();
            appendString(input.value+"\n");
            callback(input.value);
          }else if(e.which==9){
            e.preventDefault();
          }
        });
        input.addEventListener('keydown', function(e){
          var key;
          switch(e.which){
            case 38:
              key="up";
              break;
            case 40:
              key="down";
              break;
            case 9:
              key="tab";
              break;
            default:
              return;
          }
          funckey&&funckey(key, input);
          e.preventDefault();
        });
      },
      
      canRead:function canRead(){
        return true;
      },
      __proto__:VFS.dummyDescProto
    };

  }
})(VFS);
