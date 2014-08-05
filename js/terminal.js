function adjustInputWidth(){
	var input=$("#inputbox");
	if(input.length==0)return;
	input.width($("body").width()-input.offset().left);
}
$(window).load(adjustInputWidth);
(function(window, $){
	var Terminal={};
	Terminal.dev={};
	window.Terminal=Terminal;
})(window, jQuery);

(function(term, $){
	var stdout={};
	stdout.color='<span class="color37 color40">';
	stdout.write=function write(data){
		var that=this;
		function genCode(str){
			var seq=str.split("\033[");
			var ret;
			if(seq[0]){
				ret=$(stdout.color);
				ret.text(seq[0]);
			}else{
				ret=$();
			}
			for(var seqNum=1;seqNum<seq.length;seqNum++){
				var txt=seq[seqNum];
				var realTextBegin=txt.indexOf("m");
				var colorCode=txt.substr(0, realTextBegin).split(";");
				if(colorCode=="0"){
					stdout.color='<span class="color37 color40">';
				}else{
					stdout.color='<span class="color'+colorCode[1]+' color'+colorCode[2]+'">';
				}
				var jq=$(stdout.color);
				jq.text(txt.substr(realTextBegin+1));
				ret=ret.add(jq);
			}
			return ret;
		}
		var datas=data.split("\n");
		$("p:last-child").append(genCode(datas[0]));
		for(var lineNum=1;lineNum<datas.length;lineNum++){
			var line=datas[lineNum];
			$("body").append("<p>");
			$("p:last-child").append(genCode(line));
		}
	};
	term.dev.stdout={
		instance:stdout,
		open:function open(){
			return stdout;
		}
	};
})(Terminal, jQuery);

(function(term, $){
	function StdInFile(){
	}
	StdInFile.prototype.readLine=function readLine(callback){
		var input=$('<input id="inputbox" class=""/>');
		$("p:last-child").append(input);
		input.keypress(function(e){
			if(e.which==13){
				input.remove();
				term.dev.stdout.instance.write(input.val());
			}
		});
	};
	term.dev.stdin={
		open:function open(){
			return new StdInFile();
		}
	};
})(Terminal, jQuery);

var stdout=Terminal.dev.stdout.open();
var stdin=Terminal.dev.stdin.open();
$(window).load(function(){
	stdout.write("Gary Guo <nbdd0121@hotmail.com>\nCopyright (c) 2014, Gary Guo. All rights reserved.\n");
	stdout.write("\033[1;40;34m~ \033[1;40;31m$ ");
	stdin.readLine(function(){});
});