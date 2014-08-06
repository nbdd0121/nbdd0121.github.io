(function(VFS, $){
	var color="color37 color40";
	function parseConfigEscape(seq){
		var splits=seq.split(";");
		switch(splits[0]){
			case "0":
				color="color37 color40";
				break;
			case "1":{
				color="";
				for(var i=1;i<splits.length;i++){
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
			ret.text(seq[0]);
		}else{
			ret=$();
		}
		for(var seqNum=1;seqNum<seq.length;seqNum++){
			var txt=seq[seqNum];
			var realTextBegin=txt.indexOf("m");
			parseConfigEscape(txt.substr(0, realTextBegin));
			var jq=$('<span class="'+color+'">');
			jq.text(txt.substr(realTextBegin+1));
			ret=ret.add(jq);
		}
		return ret;
	}
	function appendString(str){
		var datas=str.split("\n");
		$("p:last-child").append(genSingleLineCode(datas[0]));
		for(var lineNum=1;lineNum<datas.length;lineNum++){
			var line=datas[lineNum];
			var prevp=$("p:last-child");
			if(prevp.text()=="")prevp.html("&nbsp;");
			$("body").append("<p>");
			$("p:last-child").append(genSingleLineCode(line));
		}
	}
	VFS.lookup("/dev/stdout", true).open=function openStdout(){
		return {
			write:appendString,
			__proto__:VFS.dummyDescProto
		};
	};
	VFS.lookup("/dev/stdin", true).open=function openStdin(){
		return {
			readLine:function readLine(callback, funckey){
				function adjustWidth(input){
					input.width($("body").width()-input.offset().left);
				}
				var input=$('<input id="inputbox" class="'+color+'" spellcheck=false />');
				$("p:last-child").append(input);
				adjustWidth(input);
				input.focus();
				input.keypress(function(e){
					if(e.which==13){
						input.remove();
						appendString(input.val()+"\n");
						callback(input.val());
					}
				});
				input.keydown(function(e){
					var key;
					switch(e.which){
					case 38:key="up";break;
					case 40:key="down";break;
					default:return;
					}
					funckey&&funckey(key, input);
					e.preventDefault();
				});
			},
			__proto__:VFS.dummyDescProto
		};
		
	}	
})(VFS, jQuery);