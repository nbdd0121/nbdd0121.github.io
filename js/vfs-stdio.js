(function(VFS, $){
  var color="colorDefault";
  function parseConfigEscape(seq){
    var splits=seq.split(";");
    switch(splits[0]){
      case "0":
        color="colorDefault";
        break;
      case "1": {
        color="";
        for(var i=1; i<splits.length; i++){
          color+="color"+splits[i]+" ";
        }
        break;
      }
    }
  }
  function genSingleLineCode(str){
    var seq=str.split("\033[");
    var ret;
    if(seq[0]){
      ret=$('<span class="'+color+'">');
      ret.html(encodeHtml(seq[0]));
    }else{
      ret=$();
    }
    for(var seqNum=1; seqNum<seq.length; seqNum++){
      var txt=seq[seqNum];
      var realTextBegin=txt.indexOf("m");
      parseConfigEscape(txt.substr(0, realTextBegin));
      var jq=$('<span class="'+color+'">');
      jq.html(encodeHtml(txt.substr(realTextBegin+1)));
      ret=ret.add(jq);
    }
    return ret;
  }
  function appendString(str){
    var datas=str.split("\n");
    $("p:last").append(genSingleLineCode(datas[0]));
    for(var lineNum=1; lineNum<datas.length; lineNum++){
      var line=datas[lineNum];
      var prevp=$("p:last");
      if(prevp.text()=="")
        prevp.html("&nbsp;");
      $("body").append("<p>");
      $("p:last").append(genSingleLineCode(line));
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
          input.width($("body").width()-input.offset().left);
        }
        var input=$('<input id="inputbox" class="'+color
            +'" spellcheck=false />');
        $("p:last-child").append(input);
        adjustWidth(input);
        input.focus();
        input.keypress(function(e){
          if(e.which==13){
            input.remove();
            appendString(input.val()+"\n");
            callback(input.val());
          }else if(e.which==9){
            e.preventDefault();
          }
        });
        input.keydown(function(e){
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
})(VFS, jQuery);
